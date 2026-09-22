export type NafCode =
  | "5610A"
  | "5610B"
  | "5610C"
  | "5630Z"
  | "5621Z"
  | "9602A"
  | "9602B"
  | "4321A"
  | "4322A"
  | "4332A"
  | "4334Z"
  | "1071C"
  | "9604Z"
  | "9313Z"
  | "8551Z"
  | "9329Z"
  | "5510Z"
  | "5520Z"
  | "8230Z";

export type SearchParams = {
  nafCodes: NafCode[];
  daysBack: number;
  postalPrefix: string; // recherche par département (préfixe CP)
  nationwide: boolean; // toute la France
  perPage: number;
};

export type AreaSearchParams = {
  secteur: string;
  ville: string;
  codePostal?: string;
};

export type LeadSource = "sirene" | "maps";

export type SireneEtablissement = {
  siret: string; // pour les lignes source "maps" : placeId Google
  source?: LeadSource;
  activitePrincipaleEtablissement?: string;
  activiteLibelle?: string; // secteur recherché (lignes "maps", pas de NAF)
  dateCreationEtablissement?: string;
  etatAdministratifEtablissement?: string;
  denominationUniteLegale?: string;
  nomUniteLegale?: string;
  adresse?: string;
  codePostalEtablissement?: string;
  libelleCommuneEtablissement?: string;

  // calculé côté front
  departement?: string;

  // enrichi via /search/enrich (OpenStreetMap) ou directement via /search/area
  telephone?: string;
  siteWeb?: string;
  presenceWeb?: "sans_site" | "avec_site" | "inconnu";
  rating?: number;
  ratingCount?: number;
};

export type WebPresenceResult = {
  matched: boolean;
  phone?: string;
  website?: string;
  hasWebsite: boolean;
};

export type PresenceFilter = "ALL" | "sans_site" | "avec_site" | "inconnu";

export type PipelineFilter =
  | "ALL"
  | "a_contacter"
  | "a_relancer"
  | "contacte"
  | "reponse"
  | "gagne"
  | "perdu";
