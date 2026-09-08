const GEOCODE_URL = "https://api-adresse.data.gouv.fr/search/";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const NAME_MATCH_RADIUS_M = 60;
const SIRET_MATCH_RADIUS_M = 300;
const GEOCODE_CONCURRENCY = 5;
const MAX_ROWS = 200;

export type WebPresenceInput = {
  siret: string;
  nom?: string;
  adresse?: string;
  codePostal?: string;
  commune?: string;
};

export type WebPresenceResult = {
  matched: boolean;
  phone?: string;
  website?: string;
  hasWebsite: boolean;
};

type Point = { lat: number; lon: number };

type OsmCandidate = Point & {
  name?: string;
  phone?: string;
  website?: string;
  siret?: string;
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function nameSimilar(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na.length < 3 || nb.length < 3) return false;
  return na.includes(nb) || nb.includes(na);
}

function haversineMeters(a: Point, b: Point): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function geocode(row: WebPresenceInput): Promise<Point | null> {
  if (!row.adresse || !row.codePostal) return null;

  const url = new URL(GEOCODE_URL);
  url.searchParams.set("q", row.adresse);
  url.searchParams.set("postcode", row.codePostal);
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    const [lon, lat] = feature.geometry.coordinates;
    return { lat, lon };
  } catch {
    return null;
  }
}

async function geocodeAll(rows: WebPresenceInput[]): Promise<Map<string, Point>> {
  const points = new Map<string, Point>();
  let cursor = 0;

  async function worker() {
    while (cursor < rows.length) {
      const row = rows[cursor++];
      const point = await geocode(row);
      if (point) points.set(row.siret, point);
    }
  }

  await Promise.all(
    Array.from({ length: GEOCODE_CONCURRENCY }, () => worker()),
  );

  return points;
}

function buildBbox(points: Point[]) {
  const pad = 0.002; // ~200m

  return {
    south: Math.min(...points.map((p) => p.lat)) - pad,
    west: Math.min(...points.map((p) => p.lon)) - pad,
    north: Math.max(...points.map((p) => p.lat)) + pad,
    east: Math.max(...points.map((p) => p.lon)) + pad,
  };
}

async function fetchOsmCandidates(bbox: {
  south: number;
  west: number;
  north: number;
  east: number;
}): Promise<OsmCandidate[]> {
  const b = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const query =
    `[out:json][timeout:25];` +
    `(node["name"]["shop"](${b});` +
    `node["name"]["amenity"](${b});` +
    `node["name"]["office"](${b});` +
    `node["name"]["craft"](${b});` +
    `node["ref:FR:SIRET"](${b}););` +
    `out center tags;`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "SireneProspection/1.0 (contact prospection tool)",
      Accept: "application/json",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) return [];

  const data = await res.json();

  return (data.elements ?? [])
    .map((e: any) => {
      const t = e.tags ?? {};
      const center = e.center ?? e;

      return {
        lat: center.lat,
        lon: center.lon,
        name: t.name,
        phone: t.phone || t["contact:phone"],
        website: t.website || t["contact:website"],
        siret: t["ref:FR:SIRET"],
      } as OsmCandidate;
    })
    .filter((c: OsmCandidate) => c.lat != null && c.lon != null);
}

export async function findWebPresence(
  rows: WebPresenceInput[],
): Promise<Map<string, WebPresenceResult>> {
  const result = new Map<string, WebPresenceResult>();
  const limited = rows.slice(0, MAX_ROWS);

  const points = await geocodeAll(limited);
  if (points.size === 0) return result;

  const bbox = buildBbox(Array.from(points.values()));
  const candidates = await fetchOsmCandidates(bbox);

  for (const row of limited) {
    const point = points.get(row.siret);
    if (!point) continue;

    let best: OsmCandidate | undefined = candidates.find(
      (c) =>
        c.siret === row.siret &&
        haversineMeters(point, c) <= SIRET_MATCH_RADIUS_M,
    );

    if (!best && row.nom) {
      let bestDist = Infinity;

      for (const c of candidates) {
        if (!c.name || !nameSimilar(c.name, row.nom)) continue;

        const d = haversineMeters(point, c);
        if (d <= NAME_MATCH_RADIUS_M && d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
    }

    if (!best) {
      result.set(row.siret, { matched: false, hasWebsite: false });
      continue;
    }

    result.set(row.siret, {
      matched: true,
      phone: best.phone,
      website: best.website,
      hasWebsite: !!best.website,
    });
  }

  return result;
}
