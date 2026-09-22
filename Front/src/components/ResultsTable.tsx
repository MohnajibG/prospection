import { SireneEtablissement } from "../types";
import { isFollowUpDue, PipelineEntry, STATUS_LABEL } from "../lib/pipeline";
import { IconCheck, IconExternal, IconInbox, IconMail, IconMapPin, IconPhone } from "./Icons";

function WebPresenceCell({
  r,
  pipelineEntry,
  onMessageClick,
  onMarkContacted,
}: {
  r: SireneEtablissement;
  pipelineEntry?: PipelineEntry;
  onMessageClick?: (row: SireneEtablissement) => void;
  onMarkContacted?: (row: SireneEtablissement) => void;
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
    const due = isFollowUpDue(pipelineEntry);

    return (
      <div className="row" style={{ gap: 6 }}>
        {!pipelineEntry ? (
          <span className="badge lead">🎯 Pas de site</span>
        ) : due ? (
          <span className="badge followup">🔔 À relancer</span>
        ) : (
          <span className={`badge ${pipelineEntry.status}`}>
            {STATUS_LABEL[pipelineEntry.status]}
          </span>
        )}
        {mailButton}
        {!pipelineEntry && (
          <button
            type="button"
            className="icon-btn"
            title="Marquer comme contacté"
            onClick={() => onMarkContacted?.(r)}
          >
            <IconCheck size={15} />
          </button>
        )}
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
  pipeline,
  sortDir,
  onSiretClick,
  onMessageClick,
  onMarkContacted,
  onToggleSort,
}: {
  rows: SireneEtablissement[];
  highlightSiret?: string | null;
  pipeline: Record<string, PipelineEntry>;
  sortDir: "asc" | "desc";
  onSiretClick?: (siret: string, row: SireneEtablissement) => void;
  onMessageClick?: (row: SireneEtablissement) => void;
  onMarkContacted?: (row: SireneEtablissement) => void;
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
            const entry = pipeline[r.siret];
            const rowClass = [
              isHighlighted ? "row-highlight" : "",
              entry ? "row-contacted" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <tr key={r.siret} className={rowClass}>
                <td>
                  {r.source === "maps" ? (
                    <button
                      className="siret-btn"
                      onClick={() => onSiretClick?.(r.siret, r)}
                      title="Ouvrir la fiche"
                    >
                      <IconMapPin size={12} />
                      Fiche
                    </button>
                  ) : (
                    <button
                      className="siret-btn"
                      onClick={() => onSiretClick?.(r.siret, r)}
                      title="Ouvrir les options de recherche"
                    >
                      <code>{r.siret}</code>
                      <IconExternal size={12} />
                    </button>
                  )}
                </td>
                <td>{nom}</td>
                <td>
                  <span className="badge">
                    {r.activitePrincipaleEtablissement || r.activiteLibelle || "—"}
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
                    pipelineEntry={entry}
                    onMessageClick={onMessageClick}
                    onMarkContacted={onMarkContacted}
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
