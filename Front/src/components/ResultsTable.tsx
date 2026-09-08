import { SireneEtablissement } from "../types";
import { IconExternal, IconInbox } from "./Icons";

export default function ResultsTable({
  rows,
  highlightSiret,
  onSiretClick,
}: {
  rows: SireneEtablissement[];
  highlightSiret?: string | null;
  onSiretClick?: (siret: string, row: SireneEtablissement) => void;
}) {
  if (!rows.length) {
    return (
      <div className="card empty-state">
        <IconInbox size={32} />
        <strong>Aucun résultat pour le moment</strong>
        <span>
          Lance une recherche avec les filtres ci-dessus, ou colle un SIRET
          pour ajouter un établissement précis.
        </span>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>SIRET</th>
            <th>Nom</th>
            <th>NAF</th>
            <th>Date création</th>
            <th>Adresse</th>
            <th>CP</th>
            <th>Département</th>
            <th>Ville</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => {
            const nom = r.denominationUniteLegale || r.nomUniteLegale || "—";
            const isHighlighted = highlightSiret === r.siret;

            return (
              <tr key={r.siret} className={isHighlighted ? "row-highlight" : ""}>
                <td>
                  <button
                    className="siret-btn"
                    onClick={() => onSiretClick?.(r.siret, r)}
                    title="Ouvrir les options de recherche"
                  >
                    <code>{r.siret}</code>
                    <IconExternal size={12} />
                  </button>
                </td>
                <td>{nom}</td>
                <td>
                  <span className="badge">
                    {r.activitePrincipaleEtablissement || "—"}
                  </span>
                </td>
                <td className={r.dateCreationEtablissement ? "" : "muted-cell"}>
                  {r.dateCreationEtablissement || "—"}
                </td>
                <td className={r.adresse ? "" : "muted-cell"}>
                  {r.adresse || "—"}
                </td>
                <td className={r.codePostalEtablissement ? "" : "muted-cell"}>
                  {r.codePostalEtablissement || "—"}
                </td>
                <td className={r.departement ? "" : "muted-cell"}>
                  {r.departement || "—"}
                </td>
                <td className={r.libelleCommuneEtablissement ? "" : "muted-cell"}>
                  {r.libelleCommuneEtablissement || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
