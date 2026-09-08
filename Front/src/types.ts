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
};
