import { SireneEtablissement } from "../types";

function escapeCell(v: unknown): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toCSV(rows: SireneEtablissement[]): string {
  const headers = [
    "siret",
    "nom",
    "naf",
    "date_creation",
    "adresse",
    "cp",
    "ville",
    "telephone",
    "email",
    "site",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    const nom = r.denominationUniteLegale || r.nomUniteLegale || "";
    lines.push(
      [
        r.siret,
        nom,
        r.activitePrincipaleEtablissement ?? "",
        r.dateCreationEtablissement ?? "",
        r.adresse ?? "",
        r.codePostalEtablissement ?? "",
        r.libelleCommuneEtablissement ?? "",
      ]
        .map(escapeCell)
        .join(",")
    );
  }
  return lines.join("\n");
}

export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
