// Le backend choisit son port au démarrage (premier port libre à partir de
// 3001, voir Back/src/server.ts) et peut en changer d'une session à l'autre.
// Plutôt que de figer ce port au build/démarrage du Front (fragile — un
// redémarrage du backend dans l'intervalle et l'URL devient fausse), on le
// retrouve au runtime, dans le navigateur, à chaque chargement de page.

const CANDIDATE_START = 3001;
const CANDIDATE_COUNT = 20;
const PROBE_TIMEOUT_MS = 800;
const STORAGE_KEY = "leadradar_backend_url";

async function probe(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

let discovery: Promise<string> | null = null;

async function discover(): Promise<string> {
  const cached = sessionStorage.getItem(STORAGE_KEY);
  if (cached && (await probe(cached))) return cached;

  const hint = import.meta.env.VITE_API_URL;
  if (hint && (await probe(hint))) {
    sessionStorage.setItem(STORAGE_KEY, hint);
    return hint;
  }

  const candidates = Array.from(
    { length: CANDIDATE_COUNT },
    (_, i) => `http://localhost:${CANDIDATE_START + i}`,
  );

  const results = await Promise.all(
    candidates.map(async (url) => ((await probe(url)) ? url : null)),
  );

  const found = results.find((u): u is string => !!u);
  if (!found) {
    throw new Error(
      "Backend introuvable (aucun serveur ne répond sur localhost:3001-3020). Vérifie qu'il tourne (npm run dev dans Back/).",
    );
  }

  sessionStorage.setItem(STORAGE_KEY, found);
  return found;
}

export function getBackendUrl(): Promise<string> {
  if (!discovery) {
    discovery = discover().catch((err) => {
      // Un échec ne doit pas "empoisonner" les tentatives suivantes.
      discovery = null;
      throw err;
    });
  }
  return discovery;
}

function invalidate() {
  discovery = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * fetch() vers le backend, avec découverte automatique de son URL.
 * Si la requête échoue au niveau réseau (le backend a pu changer de port
 * entre-temps), on oublie l'URL mise en cache et on retente une fois.
 */
export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = await getBackendUrl();

  try {
    return await fetch(`${url}${path}`, init);
  } catch (err) {
    if (!(err instanceof TypeError)) throw err;

    invalidate();
    const retryUrl = await getBackendUrl();
    return fetch(`${retryUrl}${path}`, init);
  }
}
