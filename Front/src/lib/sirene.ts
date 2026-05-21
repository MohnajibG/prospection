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

/**
 * Champs en sortie.
 * On ajoute periodesEtablissement pour récupérer valeurs historisées.
 */
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
  const currentPeriod = e.periodesEtablissement?.[0] ?? e;
  const ul = e.uniteLegale ?? e;

  const address = [
    currentPeriod.numeroVoieEtablissement,
    currentPeriod.typeVoieEtablissement,
    currentPeriod.libelleVoieEtablissement,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    siret: e.siret,
    activitePrincipaleEtablissement:
      currentPeriod.activitePrincipaleEtablissement ??
      e.activitePrincipaleEtablissement,
    dateCreationEtablissement: e.dateCreationEtablissement,
    etatAdministratifEtablissement: e.etatAdministratifEtablissement,
    denominationUniteLegale:
      ul.denominationUniteLegale ?? e.denominationUniteLegale,
    nomUniteLegale:
      ul.nomUniteLegale ??
      ul.nomUniteLegale1 ??
      e.nomUniteLegale ??
      e.nomUniteLegale1,
    adresse: address,
    codePostalEtablissement:
      currentPeriod.codePostalEtablissement ?? e.codePostalEtablissement,
    libelleCommuneEtablissement:
      currentPeriod.libelleCommuneEtablissement ??
      e.libelleCommuneEtablissement,
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Recherche tous les résultats (pagination curseur)
 */
export async function fetchNewEtablissements(
  p: SearchParams,
  maxPages = p.nationwide ? 5 : 10
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

      // retry 429
      for (let attempt = 0; attempt < 5; attempt++) {
        res = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            "X-INSEE-Api-Key-Integration": p.apiKey,
          },
        });

        if (res.status !== 429) break;
        await sleep(2500 * (attempt + 1));
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

      await sleep(2200); // throttle
    }
  }

  return Array.from(new Map(out.map((e) => [e.siret, e])).values());
}

/**
 * ✅ Recherche 1 établissement par SIRET (adresse directe)
 */
/**
 * ✅ Recherche 1 établissement par SIRET (adresse directe)
 * Ici on NE MET PAS `champs` pour récupérer les périodes et l’adresse complète.
 */
export async function fetchEtablissementBySiret(
  siret: string,
  apiKey: string
): Promise<SireneEtablissement | null> {
  const clean = siret.replace(/\s+/g, "");
  if (!/^\d{14}$/.test(clean)) {
    throw new Error("SIRET invalide (14 chiffres).");
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("q", `siret:${clean}`);
  url.searchParams.set("nombre", "1");
  // 🚫 surtout pas de champs ici

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-INSEE-Api-Key-Integration": apiKey,
    },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`SIRENE API error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  const etab = data.etablissements?.[0];
  if (!etab) return null;

  // ✅ on prend la période courante si elle existe
  const p0 = etab.periodesEtablissement?.[0];

  const numeroVoie =
    p0?.numeroVoieEtablissement ?? etab.numeroVoieEtablissement;
  const typeVoie = p0?.typeVoieEtablissement ?? etab.typeVoieEtablissement;
  const libelleVoie =
    p0?.libelleVoieEtablissement ?? etab.libelleVoieEtablissement;

  const adresse = [numeroVoie, typeVoie, libelleVoie].filter(Boolean).join(" ");

  const ul = etab.uniteLegale ?? etab;

  return {
    siret: etab.siret,
    activitePrincipaleEtablissement:
      p0?.activitePrincipaleEtablissement ??
      etab.activitePrincipaleEtablissement,
    dateCreationEtablissement: etab.dateCreationEtablissement,
    denominationUniteLegale:
      ul.denominationUniteLegale ?? etab.denominationUniteLegale,
    nomUniteLegale:
      ul.nomUniteLegale ??
      ul.nomUniteLegale1 ??
      etab.nomUniteLegale ??
      etab.nomUniteLegale1,
    adresse,
    codePostalEtablissement:
      p0?.codePostalEtablissement ?? etab.codePostalEtablissement,
    libelleCommuneEtablissement:
      p0?.libelleCommuneEtablissement ?? etab.libelleCommuneEtablissement,
  };
}
