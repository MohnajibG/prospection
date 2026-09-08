import { SearchParams, SireneEtablissement } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function fetchNewEtablissements(
  p: SearchParams
): Promise<SireneEtablissement[]> {
  const res = await fetch(`${API_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (!Array.isArray(data)) throw new Error(data?.error ?? "Erreur inconnue");

  return data;
}

export async function fetchEtablissementBySiret(
  siret: string
): Promise<SireneEtablissement | null> {
  const clean = siret.replace(/\s+/g, "");
  const res = await fetch(`${API_URL}/search/siret/${clean}`);

  if (res.status === 404) return null;

  const data = await res.json();

  if (!res.ok) throw new Error(data?.error ?? `API error ${res.status}`);

  return data;
}
