import { SearchParams, SireneEtablissement, WebPresenceResult } from "../types";
import { backendFetch } from "../lib/backendDiscovery";

export type SearchResult = {
  rows: SireneEtablissement[];
  warning?: string;
};

export async function fetchNewEtablissements(
  p: SearchParams
): Promise<SearchResult> {
  const res = await backendFetch("/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (data?.error) throw new Error(data.error);

  return { rows: data.data ?? [], warning: data.warning };
}

export async function fetchEtablissementBySiret(
  siret: string
): Promise<SireneEtablissement | null> {
  const clean = siret.replace(/\s+/g, "");
  const res = await backendFetch(`/search/siret/${clean}`);

  if (res.status === 404) return null;

  const data = await res.json();

  if (!res.ok) throw new Error(data?.error ?? `API error ${res.status}`);

  return data;
}

export async function enrichWebPresence(
  rows: {
    siret: string;
    nom?: string;
    adresse?: string;
    codePostal?: string;
    commune?: string;
  }[]
): Promise<Record<string, WebPresenceResult>> {
  const res = await backendFetch("/search/enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data?.error ?? `API error ${res.status}`);

  return data;
}
