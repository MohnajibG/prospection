export type NafCode = "5610A" | "5610B" | "5610C" | "5630Z" | "5621Z";

export type SearchParams = {
  nafCodes: NafCode[];
  daysBack: number;
  postalPrefix: string; // recherche par département (préfixe CP)
  nationwide: boolean; // toute la France
  perPage: number;
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

  // calculé côté front
  departement?: string;

  // enrichi via /search/enrich (OpenStreetMap)
  telephone?: string;
  siteWeb?: string;
  presenceWeb?: "sans_site" | "avec_site" | "inconnu";
};

export type WebPresenceResult = {
  matched: boolean;
  phone?: string;
  website?: string;
  hasWebsite: boolean;
};

export type PresenceFilter = "ALL" | "sans_site" | "avec_site" | "inconnu";
