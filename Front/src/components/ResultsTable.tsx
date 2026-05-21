import { SireneEtablissement } from "../types";

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
    return <div className="card muted">Aucun résultat pour le moment.</div>;
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
              <tr
                key={r.siret}
                className={isHighlighted ? "row-highlight" : ""}
              >
                <td>
                  {/* SIRET rendu cliquable */}
                  <button
                    onClick={() => onSiretClick?.(r.siret, r)}
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      margin: 0,
                      cursor: "pointer",
                      color: "#0366d6",
                    }}
                    title="Ouvrir options de recherche"
                  >
                    <code>{r.siret}</code>
                  </button>
                </td>
                <td>{nom}</td>
                <td>
                  <span className="badge">
                    {r.activitePrincipaleEtablissement || "—"}
                  </span>
                </td>
                <td>{r.dateCreationEtablissement || "—"}</td>
                <td>{r.adresse || "—"}</td>
                <td>{r.codePostalEtablissement || "—"}</td>
                <td>{r.departement || "—"}</td>
                <td>{r.libelleCommuneEtablissement || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
