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

function isTransientStatus(status: number): boolean {
  // 429 = limite de débit ; 5xx = indisponibilité ponctuelle côté INSEE
  // (fréquente sous charge) — les deux valent la peine d'être retentées.
  return status === 429 || status >= 500;
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

    if (!isTransientStatus(res.status)) break;

    await sleep(2500 * (attempt + 1));
  }

  return res!;
}

export type FetchNewEtablissementsResult = {
  data: SireneEtablissement[];
  warning?: string;
};

export async function fetchNewEtablissements(
  p: SearchParams
): Promise<FetchNewEtablissementsResult> {
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
  let lastErrorStatus: number | null = null;
  const failedNafs: string[] = [];

  for (const naf of nafCodes) {
    // activitePrincipaleEtablissement est un champ historisé : il doit être
    // interrogé via periode(...), sinon l'API renvoie une erreur de syntaxe.
    // dateCreationEtablissement, elle, ne change jamais après création : on la
    // filtre directement dans la requête pour éviter de paginer dans tout
    // l'historique (des centaines de milliers d'établissements par NAF) alors
    // qu'on ne veut que les `daysBack` derniers jours.
    const q = `periode(activitePrincipaleEtablissement:${naf}) AND dateCreationEtablissement:[${start} TO *]`;
    let cursor = "*";
    let page = 0;
    let nafSucceeded = false;

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
        // L'API Sirene renvoie 404 quand la requête ne matche aucun
        // établissement (ex : aucune cafétéria créée récemment dans la
        // zone) — ce n'est pas une erreur, juste un résultat vide.
        if (res.status === 404) {
          anySuccess = true;
          nafSucceeded = true;
          break;
        }

        const txt = await res.text();
        console.error("INSEE ERROR:", { status: res.status, query: q, body: txt });
        lastErrorStatus = res.status;
        break;
      }

      anySuccess = true;
      nafSucceeded = true;

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

    if (!nafSucceeded) failedNafs.push(naf);
  }

  if (!anySuccess) {
    if (lastErrorStatus === 401 || lastErrorStatus === 403) {
      throw new Error(
        "Clé API INSEE invalide, expirée ou révoquée — vérifie INSEE_API_KEY dans Back/.env."
      );
    }

    if (lastErrorStatus === 429) {
      throw new Error(
        "Limite de débit INSEE atteinte (30 requêtes/min) — réessaie dans une minute."
      );
    }

    throw new Error(
      "Impossible de contacter l'API INSEE (erreur serveur). Réessaie dans quelques minutes."
    );
  }

  const data = Array.from(new Map(out.map((e) => [e.siret, e])).values());

  if (failedNafs.length > 0) {
    const cause = lastErrorStatus === 429 ? "limite de débit INSEE atteinte" : "erreur INSEE";
    return {
      data,
      warning: `Résultats partiels : impossible de vérifier ${failedNafs.join(", ")} (${cause}). Réessaie dans une minute pour ces activités.`,
    };
  }

  return { data };
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

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "Clé API INSEE invalide, expirée ou révoquée — vérifie INSEE_API_KEY dans Back/.env."
    );
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`SIRENE API error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  const etab = data.etablissements?.[0];
  if (!etab) return null;

  return mapEtablissement(etab);
}
