import { SearchParams, SireneEtablissement } from "../types";
import { daysAgoISO } from "../lib/date";

const BASE_URL = "https://api.insee.fr/api-sirene/3.11/siret";

function formatNaf(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/[^0-9A-Z]/g, "");
}

function getDepartmentPrefixes(p: SearchParams): string[] {
  if (p.nationwide) return [];

  return (p.postalPrefix ?? "")
    .split(/[,\s]+/)
    .map((d) => d.trim().replace(/[^0-9]/g, ""))
    .filter((d) => d.length >= 2 && d.length <= 3);
}

// ✅ Champs valides SIRENE 3.11 (pas de tel/mail/site) :contentReference[oaicite:2]{index=2}
const FIELDS = [
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

type SireneRaw = any;

function mapRaw(e: SireneRaw): SireneEtablissement {
  const ul = e.uniteLegale ?? {};
  const address = [
    e.numeroVoieEtablissement,
    e.typeVoieEtablissement,
    e.libelleVoieEtablissement,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    siret: e.siret,
    activitePrincipaleEtablissement: e.activitePrincipaleEtablissement,
    dateCreationEtablissement: e.dateCreationEtablissement,
    etatAdministratifEtablissement: e.etatAdministratifEtablissement,
    denominationUniteLegale: ul.denominationUniteLegale,
    nomUniteLegale: ul.nomUniteLegale || ul.nomUniteLegale1,
    adresse: address,
    codePostalEtablissement: e.codePostalEtablissement,
    libelleCommuneEtablissement: e.libelleCommuneEtablissement,
  };
}

/**
 * Recherche tous les résultats (pagination curseur) et renvoie une liste.
 */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchNewEtablissements(
  p: SearchParams,
  maxPages = 10 // limite raisonnable
): Promise<SireneEtablissement[]> {
  const nafCodes = (p.nafCodes ?? []).map(formatNaf).filter(Boolean);
  if (nafCodes.length === 0) {
    throw new Error("Choisis au moins une activité (NAF).");
  }

  const start = daysAgoISO(p.daysBack);
  const departments = getDepartmentPrefixes(p);
  const out: SireneEtablissement[] = [];

  for (const naf of nafCodes) {
    const q = `activitePrincipaleEtablissement:${naf}`;
    console.log("SIRENE q =", q);

    let cursor = "*";
    let page = 0;

    while (true) {
      page++;
      if (page > maxPages) break;

      const url = new URL(BASE_URL);
      url.searchParams.set("q", q);
      url.searchParams.set("champs", FIELDS);
      url.searchParams.set("nombre", String(p.perPage));
      url.searchParams.set("curseur", cursor);

      let res: Response | null = null;

      // ✅ retry 429 avec backoff simple
      for (let attempt = 0; attempt < 5; attempt++) {
        res = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            "X-INSEE-Api-Key-Integration": p.apiKey,
          },
        });

        if (res.status !== 429) break;

        const wait = 2500 * (attempt + 1); // 2.5s, 5s, 7.5s...
        console.warn(`429 rate limit, retry in ${wait}ms`);
        await sleep(wait);
      }

      if (!res || !res.ok) {
        const txt = res ? await res.text() : "no response";
        throw new Error(`SIRENE API error ${res?.status}: ${txt}`);
      }

      const data = await res.json();
      const etabs = (data.etablissements ?? [])
        .map(mapRaw)
        .filter((e: SireneEtablissement) => {
          const active = e.etatAdministratifEtablissement === "A";
          const recent =
            !!e.dateCreationEtablissement &&
            e.dateCreationEtablissement >= start;
          const inDepartment =
            departments.length === 0 ||
            departments.some((d) =>
              e.codePostalEtablissement?.startsWith(d),
            );

          return active && recent && inDepartment;
        });

      out.push(...etabs);

      const next = data.header?.curseurSuivant;
      if (!next) break;
      cursor = next;

      // ✅ pause entre pages pour ne pas dépasser 30/min
      await sleep(2200); // ~27 requêtes/min max
    }
  }

  return Array.from(new Map(out.map((e) => [e.siret, e])).values());
}
