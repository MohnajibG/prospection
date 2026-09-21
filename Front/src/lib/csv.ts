import { SireneEtablissement } from "../types";

// Excel en locale française attend ";" comme séparateur de colonnes (la
// virgule sert de séparateur décimal) — avec une virgule, Excel abandonne le
// découpage en colonnes et vide chaque ligne brute dans la colonne A.
const DELIMITER = ";";

const PRESENCE_LABELS: Record<string, string> = {
  sans_site: "Pas de site",
  avec_site: "A un site",
  inconnu: "Non vérifié",
};

function escapeCell(v: unknown): string {
  const s = String(v ?? "");
  if (new RegExp(`["${DELIMITER}\n]`).test(s)) return '"' + s.replace(/"/g, '""') + '"';
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
    "departement",
    "ville",
    "telephone",
    "site",
    "presence_web",
  ];
  const lines = [headers.join(DELIMITER)];
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
        r.departement ?? "",
        r.libelleCommuneEtablissement ?? "",
        r.telephone ?? "",
        r.siteWeb ?? "",
        r.presenceWeb ? PRESENCE_LABELS[r.presenceWeb] ?? r.presenceWeb : "",
      ]
        .map(escapeCell)
        .join(DELIMITER)
    );
  }
  return lines.join("\n");
}

export function downloadCSV(filename: string, content: string) {
  // Le BOM UTF-8 permet à Excel de détecter l'encodage correctement (sans
  // ça, les caractères accentués s'affichent en charabia).
  const BOM = "﻿";
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
