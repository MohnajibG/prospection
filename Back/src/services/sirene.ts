const BASE_URL = "https://api.insee.fr/api-sirene/3.11/siret";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function formatNaf(code: string) {
  return code
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/[^0-9A-Z]/g, "");
}

export async function fetchNewEtablissements(p: any) {
  const apiKey = process.env.INSEE_API_KEY;

  if (!apiKey) {
    console.warn("INSEE_API_KEY missing");
    return [];
  }

  const nafCodes = (p.nafCodes || ["5610A"]).map(formatNaf).filter(Boolean);

  const startDate = daysAgoISO(p.daysBack || 30);
  const perPage = p.perPage || 100;

  let all: any[] = [];

  for (const naf of nafCodes) {
    // 🔥 QUERY ULTRA SAFE (INSEE ACCEPTÉ À 100%)
    const q = `activitePrincipaleEtablissement:${naf}`;

    const url = new URL(BASE_URL);
    url.searchParams.set("q", q);
    url.searchParams.set("nombre", String(perPage));

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-INSEE-Api-Key-Integration": apiKey,
        },
      });

      const text = await res.text();

      if (!res.ok) {
        console.error("INSEE ERROR:", {
          status: res.status,
          query: q,
          body: text,
        });
        continue;
      }

      const json = JSON.parse(text);
      const items = json?.etablissements || [];

      // 🔥 FILTRE MÉTIER (IMPORTANT : PAS DANS INSEE)
      const filtered = items.filter((e: any) => {
        const date = e.dateCreationEtablissement;
        const actif = e.etatAdministratifEtablissement === "A";

        return actif && date && date >= startDate;
      });

      all = all.concat(filtered);
    } catch (err) {
      console.error("INSEE NETWORK ERROR:", err);
    }
  }

  // 🔥 DEDUPE SIRET
  const map = new Map();

  for (const e of all) {
    if (e?.siret && !map.has(e.siret)) {
      map.set(e.siret, e);
    }
  }

  return Array.from(map.values()).map((e: any) => ({
    siret: e.siret,
    denominationUniteLegale: e.uniteLegale?.denominationUniteLegale,
    nomUniteLegale: e.uniteLegale?.nomUniteLegale,
    dateCreationEtablissement: e.dateCreationEtablissement,
    codePostalEtablissement: e.adresseEtablissement?.codePostal,
    etatAdministratifEtablissement: e.etatAdministratifEtablissement,
  }));
}
