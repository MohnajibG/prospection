const STORAGE_KEY = "sirene_contacted";

export function getContactedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function persist(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore (stockage indisponible)
  }
}

export function setContacted(set: Set<string>, siret: string, contacted: boolean): Set<string> {
  const next = new Set(set);
  if (contacted) next.add(siret);
  else next.delete(siret);
  persist(next);
  return next;
}
