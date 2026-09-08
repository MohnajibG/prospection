const BASE_URL = "https://api.insee.fr/api-sirene/3.11/siret";

export type SearchParams = {
  nafCodes: string[];
  daysBack: number;
  postalPrefix?: string;
  nationwide?: boolean;
  perPage?: number;
};

export type SireneEtablissement = {
  siret: string;
  activitePrincipaleEtablissement?: string;
  dateCreationEtablissement?: string;
  etatAdministratifEtablissement?: string;
  denominationUniteLegale?: string;
  nomUniteLegale?: string;
  adresse?: string;
  codePostalEtablissement?: string;
  libelleCommuneEtablissement?: string;
};

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatNaf(code: string): string {
  const clean = code
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/[^0-9A-Z]/g, "");

  if (/^\d{4}[A-Z]$/.test(clean)) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 4)}${clean.slice(4)}`;
  }

  return clean;
}

function getDepartmentPrefixes(p: SearchParams): string[] {
  if (p.nationwide) return [];

  return (p.postalPrefix ?? "")
    .split(/[,\s]+/)
    .map((d) => d.trim().replace(/[^0-9]/g, ""))
    .filter((d) => d.length >= 2 && d.length <= 3);
}

function requireApiKey(): string {
  const apiKey = process.env.INSEE_API_KEY;
  if (!apiKey) throw new Error("INSEE_API_KEY manquante côté serveur");
  return apiKey;
}

// Champs demandés (l'API renvoie toujours une forme imbriquée : uniteLegale,
// adresseEtablissement, periodesEtablissement — `champs` ne fait que filtrer
// ce qui apparaît dans ces sous-objets, il n'aplatit rien).
const LIST_FIELDS = [
  "siret",
  "denominationUniteLegale",
  "nomUniteLegale",
  "activitePrincipaleEtablissement",
  "dateCreationEtablissement",
  "etatAdministratifEtablissement",
  "numeroVoieEtablissement",
  "typeVoieEtablissement",
  "libelleVoieEtablissement",
  "codePostalEtablissement",
  "libelleCommuneEtablissement",
].join(",");

function mapEtablissement(e: any): SireneEtablissement {
  const ul = e.uniteLegale ?? {};
  const adr = e.adresseEtablissement ?? {};
  const period = e.periodesEtablissement?.[0] ?? {};

  const adresse = [
    adr.numeroVoieEtablissement,
    adr.typeVoieEtablissement,
    adr.libelleVoieEtablissement,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    siret: e.siret,
    activitePrincipaleEtablissement: period.activitePrincipaleEtablissement,
    dateCreationEtablissement: e.dateCreationEtablissement,
    etatAdministratifEtablissement: period.etatAdministratifEtablissement,
    denominationUniteLegale: ul.denominationUniteLegale,
    nomUniteLegale: ul.nomUniteLegale || ul.nomUniteLegale1,
    adresse,
    codePostalEtablissement: adr.codePostalEtablissement,
    libelleCommuneEtablissement: adr.libelleCommuneEtablissement,
  };
}

async function fetchWithRetry(url: URL, apiKey: string): Promise<Response> {
  let res: Response | undefined;

  for (let attempt = 0; attempt < 5; attempt++) {
    res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-INSEE-Api-Key-Integration": apiKey,
      },
    });

    if (res.status !== 429) break;

    await sleep(2500 * (attempt + 1));
  }

  return res!;
}

export async function fetchNewEtablissements(
  p: SearchParams
): Promise<SireneEtablissement[]> {
  const apiKey = requireApiKey();

  const nafCodes = (p.nafCodes || []).map(formatNaf).filter(Boolean);
  if (nafCodes.length === 0) {
    throw new Error("Choisis au moins une activité (NAF).");
  }

  const start = daysAgoISO(p.daysBack ?? 30);
  const departments = getDepartmentPrefixes(p);
  const perPage = p.perPage || 100;
  const maxPages = p.nationwide ? 5 : 10;

  const out: SireneEtablissement[] = [];
  let anySuccess = false;

  for (const naf of nafCodes) {
    // activitePrincipaleEtablissement est un champ historisé : il doit être
    // interrogé via periode(...), sinon l'API renvoie une erreur de syntaxe.
    const q = `periode(activitePrincipaleEtablissement:${naf})`;
    let cursor = "*";
    let page = 0;

    while (true) {
      page++;
      if (page > maxPages) break;

      const url = new URL(BASE_URL);
      url.searchParams.set("q", q);
      url.searchParams.set("champs", LIST_FIELDS);
      url.searchParams.set("nombre", String(perPage));
      url.searchParams.set("curseur", cursor);

      const res = await fetchWithRetry(url, apiKey);

      if (!res.ok) {
        const txt = await res.text();
        console.error("INSEE ERROR:", { status: res.status, query: q, body: txt });
        break;
      }

      anySuccess = true;

      const data = await res.json();
      const etabs = (data.etablissements ?? [])
        .map(mapEtablissement)
        .filter((e: SireneEtablissement) => {
          const active = e.etatAdministratifEtablissement === "A";
          const recent =
            !!e.dateCreationEtablissement && e.dateCreationEtablissement >= start;
          const inDepartment =
            departments.length === 0 ||
            departments.some((d) => e.codePostalEtablissement?.startsWith(d));

          return active && recent && inDepartment;
        });

      out.push(...etabs);

      const next = data.header?.curseurSuivant;
      if (!next) break;
      cursor = next;

      await sleep(2200); // throttle, ~27 requêtes/min max
    }
  }

  if (!anySuccess) {
    throw new Error(
      "Impossible de contacter l'API INSEE (erreur serveur). Réessaie dans quelques minutes."
    );
  }

  return Array.from(new Map(out.map((e) => [e.siret, e])).values());
}

export async function fetchEtablissementBySiret(
  siret: string
): Promise<SireneEtablissement | null> {
  const apiKey = requireApiKey();

  const clean = siret.replace(/\s+/g, "");
  if (!/^\d{14}$/.test(clean)) {
    throw new Error("SIRET invalide (14 chiffres).");
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("q", `siret:${clean}`);
  url.searchParams.set("nombre", "1");

  const res = await fetchWithRetry(url, apiKey);

  if (res.status === 404) return null;

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`SIRENE API error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  const etab = data.etablissements?.[0];
  if (!etab) return null;

  return mapEtablissement(etab);
}
