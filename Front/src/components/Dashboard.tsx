import { isFollowUpDue, Pipeline, PipelineEntry } from "../lib/pipeline";
import { IconInbox } from "./Icons";

type Row = { siret: string; entry: PipelineEntry };

function sourceLabel(source?: string): string {
  return source === "maps" ? "📍 Maps" : "🧾 SIRENE";
}

function LeadList({ title, rows, emptyText }: { title: string; rows: Row[]; emptyText: string }) {
  return (
    <div className="card">
      <strong style={{ fontSize: 13.5 }}>{title}</strong>

      {rows.length === 0 ? (
        <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
          {emptyText}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {rows.map(({ siret, entry }) => (
            <div className="row between" key={siret} style={{ fontSize: 13 }}>
              <span>
                {entry.nom || "Établissement"}
                {entry.ville && <span className="muted"> — {entry.ville}</span>}
              </span>
              <span className="muted" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>
                {sourceLabel(entry.source)} · {entry.contactedAt}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ pipeline }: { pipeline: Pipeline }) {
  const rows: Row[] = Object.entries(pipeline).map(([siret, entry]) => ({ siret, entry }));

  if (rows.length === 0) {
    return (
      <div className="card empty-state">
        <IconInbox size={32} />
        <strong>Rien à afficher pour le moment</strong>
        <span>
          Marque des établissements comme "contactés" depuis la recherche pour
          voir apparaître ton suivi ici.
        </span>
      </div>
    );
  }

  const total = rows.length;
  const relance = rows.filter((r) => isFollowUpDue(r.entry));
  const reponse = rows.filter((r) => r.entry.status === "reponse");
  const gagne = rows.filter((r) => r.entry.status === "gagne");
  const perdu = rows.filter((r) => r.entry.status === "perdu");
  const conversionRate = total > 0 ? Math.round((gagne.length / total) * 100) : 0;

  const stats: { label: string; value: number | string; tone: string }[] = [
    { label: "Total suivis", value: total, tone: "muted" },
    { label: "À relancer", value: relance.length, tone: "warning" },
    { label: "Ont répondu", value: reponse.length, tone: "accent" },
    { label: "Gagnés", value: gagne.length, tone: "success" },
    { label: "Perdus", value: perdu.length, tone: "danger" },
    { label: "Taux de conversion", value: `${conversionRate}%`, tone: "muted" },
  ];

  const recentWins = [...gagne].sort((a, b) => b.entry.contactedAt.localeCompare(a.entry.contactedAt)).slice(0, 8);
  const dueFollowUps = [...relance].sort((a, b) => a.entry.contactedAt.localeCompare(b.entry.contactedAt));

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="stat-cards">
        {stats.map((s) => (
          <div key={s.label} className={`stat-card stat-card--${s.tone} active`}>
            <span className="stat-card__value">{s.value}</span>
            <span className="stat-card__label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <LeadList
          title={`🔔 À relancer (${dueFollowUps.length})`}
          rows={dueFollowUps}
          emptyText="Aucune relance en attente — tout est à jour."
        />
        <LeadList
          title={`🏆 Gagnés récemment (${recentWins.length})`}
          rows={recentWins}
          emptyText="Pas encore de client gagné via ce pipeline."
        />
      </div>
    </div>
  );
}
