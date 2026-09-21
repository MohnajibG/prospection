import type { PresenceFilter } from "../types";
import { IconInbox, IconMapPin, IconTarget } from "./Icons";

type Stat = {
  key: PresenceFilter;
  label: string;
  value: number;
  icon: JSX.Element;
  tone: "accent" | "success" | "muted";
};

export default function StatCards({
  total,
  sansSite,
  avecSite,
  inconnu,
  active,
  onSelect,
}: {
  total: number;
  sansSite: number;
  avecSite: number;
  inconnu: number;
  active: PresenceFilter;
  onSelect: (f: PresenceFilter) => void;
}) {
  const stats: Stat[] = [
    { key: "ALL", label: "Total", value: total, icon: <IconInbox size={16} />, tone: "muted" },
    {
      key: "sans_site",
      label: "Leads (sans site)",
      value: sansSite,
      icon: <IconTarget size={16} />,
      tone: "success",
    },
    {
      key: "avec_site",
      label: "Ont déjà un site",
      value: avecSite,
      icon: <IconMapPin size={16} />,
      tone: "accent",
    },
    {
      key: "inconnu",
      label: "Non vérifiés",
      value: inconnu,
      icon: <IconInbox size={16} />,
      tone: "muted",
    },
  ];

  return (
    <div className="stat-cards">
      {stats.map((s) => (
        <button
          type="button"
          key={s.key}
          className={`stat-card stat-card--${s.tone} ${active === s.key ? "active" : ""}`}
          onClick={() => onSelect(active === s.key && s.key !== "ALL" ? "ALL" : s.key)}
        >
          <span className="stat-card__icon">{s.icon}</span>
          <span className="stat-card__value">{s.value}</span>
          <span className="stat-card__label">{s.label}</span>
        </button>
      ))}
    </div>
  );
}
