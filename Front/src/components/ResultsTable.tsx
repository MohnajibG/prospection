import { SireneEtablissement } from "../types";
import { IconCheck, IconClose, IconExternal, IconInbox, IconMail, IconPhone } from "./Icons";

function WebPresenceCell({
  r,
  isContacted,
  onMessageClick,
  onToggleContacted,
}: {
  r: SireneEtablissement;
  isContacted: boolean;
  onMessageClick?: (row: SireneEtablissement) => void;
  onToggleContacted?: (siret: string) => void;
}) {
  const isLead = r.presenceWeb === "sans_site";

  const mailTitle = isLead
    ? "Générer un message de prospection"
    : r.presenceWeb === "avec_site"
      ? "Cet établissement a déjà un site — pas besoin de message"
      : "Vérifie d'abord la présence web (bouton « Revérifier ») pour pouvoir générer un message";

  const mailButton = (
    <button
      type="button"
      className="icon-btn"
      title={mailTitle}
      disabled={!isLead}
      onClick={() => isLead && onMessageClick?.(r)}
    >
      <IconMail size={15} />
    </button>
  );

  if (r.presenceWeb === "sans_site") {
    return (
      <div className="row" style={{ gap: 6 }}>
        {isContacted ? (
          <span className="badge contacted">✅ Contacté</span>
        ) : (
          <span className="badge lead">🎯 Pas de site</span>
        )}
        {mailButton}
        <button
          type="button"
          className="icon-btn"
          title={isContacted ? "Retirer le statut « contacté »" : "Marquer comme contacté"}
          onClick={() => onToggleContacted?.(r.siret)}
        >
          {isContacted ? <IconClose size={15} /> : <IconCheck size={15} />}
        </button>
      </div>
    );
  }

  if (r.presenceWeb === "avec_site") {
    return (
      <div className="row" style={{ gap: 6 }}>
        {r.siteWeb ? (
          <a href={r.siteWeb} target="_blank" rel="noopener noreferrer" className="siret-btn">
            A un site
            <IconExternal size={12} />
          </a>
        ) : (
          <span className="muted-cell">A un site</span>
        )}
        {mailButton}
      </div>
    );
  }

  return (
    <div className="row" style={{ gap: 6 }}>
      <span className="muted-cell">—</span>
      {mailButton}
    </div>
  );
}

export default function ResultsTable({
  rows,
  highlightSiret,
  contacted,
  sortDir,
  onSiretClick,
  onMessageClick,
  onToggleContacted,
  onToggleSort,
}: {
  rows: SireneEtablissement[];
  highlightSiret?: string | null;
  contacted: Set<string>;
  sortDir: "asc" | "desc";
  onSiretClick?: (siret: string, row: SireneEtablissement) => void;
  onMessageClick?: (row: SireneEtablissement) => void;
  onToggleContacted?: (siret: string) => void;
  onToggleSort?: () => void;
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
            <th>
              <button type="button" className="th-sort" onClick={onToggleSort}>
                Date création
                <span className="th-sort__arrow">{sortDir === "desc" ? "↓" : "↑"}</span>
              </button>
            </th>
            <th>Adresse</th>
            <th>CP</th>
            <th>Département</th>
            <th>Ville</th>
            <th>Téléphone</th>
            <th>Présence web</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => {
            const nom = r.denominationUniteLegale || r.nomUniteLegale || "—";
            const isHighlighted = highlightSiret === r.siret;
            const isContacted = contacted.has(r.siret);
            const rowClass = [
              isHighlighted ? "row-highlight" : "",
              isContacted ? "row-contacted" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <tr key={r.siret} className={rowClass}>
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
                <td className={r.telephone ? "" : "muted-cell"}>
                  {r.telephone ? (
                    <a href={`tel:${r.telephone}`} className="siret-btn">
                      <IconPhone size={12} />
                      {r.telephone}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <WebPresenceCell
                    r={r}
                    isContacted={isContacted}
                    onMessageClick={onMessageClick}
                    onToggleContacted={onToggleContacted}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
