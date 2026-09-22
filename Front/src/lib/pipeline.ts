import { LeadSource, SireneEtablissement } from "../types";

const STORAGE_KEY = "sirene_pipeline";
const LEGACY_CONTACTED_KEY = "sirene_contacted";
const FOLLOW_UP_DAYS = 4;

export type PipelineStatus = "contacte" | "reponse" | "gagne" | "perdu";

export type PipelineEntry = {
  status: PipelineStatus;
  contactedAt: string; // yyyy-mm-dd
  // Snapshot du lead au moment du premier contact, pour pouvoir l'afficher
  // dans le dashboard même s'il n'est plus dans les résultats de recherche.
  nom?: string;
  ville?: string;
  source?: LeadSource;
};

export type Pipeline = Record<string, PipelineEntry>;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function persist(map: Pipeline) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore (stockage indisponible)
  }
}

export function getPipeline(): Pipeline {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    // Migration unique depuis l'ancien statut booléen "contacté".
    const legacyRaw = localStorage.getItem(LEGACY_CONTACTED_KEY);
    if (legacyRaw) {
      const sirets: string[] = JSON.parse(legacyRaw);
      const today = todayISO();
      const migrated: Pipeline = {};
      for (const siret of sirets) migrated[siret] = { status: "contacte", contactedAt: today };
      persist(migrated);
      return migrated;
    }

    return {};
  } catch {
    return {};
  }
}

export function markContacted(map: Pipeline, row: SireneEtablissement): Pipeline {
  const next: Pipeline = {
    ...map,
    [row.siret]: {
      status: "contacte",
      contactedAt: todayISO(),
      nom: row.denominationUniteLegale || row.nomUniteLegale,
      ville: row.libelleCommuneEtablissement,
      source: row.source ?? "sirene",
    },
  };
  persist(next);
  return next;
}

export function setStatus(map: Pipeline, siret: string, status: PipelineStatus): Pipeline {
  const existing = map[siret];
  if (!existing) return map;

  const next: Pipeline = { ...map, [siret]: { ...existing, status } };
  persist(next);
  return next;
}

export function clearStatus(map: Pipeline, siret: string): Pipeline {
  const next = { ...map };
  delete next[siret];
  persist(next);
  return next;
}

export function isFollowUpDue(entry?: PipelineEntry): boolean {
  if (!entry || entry.status !== "contacte") return false;

  const due = new Date(entry.contactedAt);
  due.setDate(due.getDate() + FOLLOW_UP_DAYS);
  return due <= new Date();
}

export const STATUS_LABEL: Record<PipelineStatus, string> = {
  contacte: "✅ Contacté",
  reponse: "💬 A répondu",
  gagne: "🏆 Gagné",
  perdu: "❌ Perdu",
};
