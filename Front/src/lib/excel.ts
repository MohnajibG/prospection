import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { SireneEtablissement } from "../types";

export function toExcel(rows: SireneEtablissement[]) {
  // On transforme les rows en objets "plats" + noms de colonnes propres
  const data = rows.map((r) => ({
    SIRET: r.siret,
    Nom: r.denominationUniteLegale || r.nomUniteLegale || "",
    NAF: r.activitePrincipaleEtablissement || "",
    "Date création": r.dateCreationEtablissement || "",
    Adresse: r.adresse || "",
    CP: r.codePostalEtablissement || "",
    Département: r.departement || "",
    Ville: r.libelleCommuneEtablissement || "",
  }));

  // Worksheet + Workbook
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Prospection");

  // Retourne un ArrayBuffer Excel
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

export function downloadExcel(filename: string, rows: SireneEtablissement[]) {
  const buf = toExcel(rows);
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });
  saveAs(blob, filename);
}
