import { nameSimilar } from "./nameMatch";

const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

// On demande directement le téléphone/site dans la recherche texte (Text
// Search Pro) : ça évite un second appel Place Details par établissement.
const FIELD_MASK =
  "places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber";

const CONCURRENCY = 5;

export type GoogleInput = {
  siret: string;
  nom?: string;
  adresse?: string;
  codePostal?: string;
  commune?: string;
};

export type GoogleResult = {
  matched: boolean;
  phone?: string;
  website?: string;
  hasWebsite: boolean;
};

class GoogleAuthError extends Error {}

async function searchOne(row: GoogleInput, apiKey: string): Promise<GoogleResult> {
  if (!row.nom) return { matched: false, hasWebsite: false };

  const textQuery = [row.nom, row.adresse, row.codePostal, row.commune]
    .filter(Boolean)
    .join(" ");

  const res = await fetch(TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "fr",
      regionCode: "FR",
      maxResultCount: 1,
    }),
  });

  if (res.status === 401 || res.status === 403) {
    const txt = await res.text();
    console.error("GOOGLE PLACES AUTH ERROR:", { status: res.status, body: txt });
    throw new GoogleAuthError(
      "Clé Google Places invalide, ou API \"Places API (New)\" non activée sur le projet Google Cloud — vérifie GOOGLE_PLACES_API_KEY dans Back/.env.",
    );
  }

  if (!res.ok) {
    // Erreur ponctuelle (quota atteint, indisponibilité...) : on ne bloque
    // pas tout le lot, ce établissement retombera sur le fallback OSM.
    const txt = await res.text();
    console.error("GOOGLE PLACES ERROR:", { status: res.status, body: txt });
    return { matched: false, hasWebsite: false };
  }

  const data = await res.json();
  const place = data.places?.[0];
  if (!place) return { matched: false, hasWebsite: false };

  // Text Search renvoie toujours "le résultat le plus proche" même pour une
  // requête bidon — on rejette les correspondances dont le nom n'a rien à
  // voir, pour éviter de classer un lead à tort comme "a déjà un site".
  const foundName = place.displayName?.text;
  if (foundName && !nameSimilar(foundName, row.nom)) {
    return { matched: false, hasWebsite: false };
  }

  return {
    matched: true,
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
    hasWebsite: !!place.websiteUri,
  };
}

export async function findViaGooglePlaces(
  rows: GoogleInput[],
  apiKey: string
): Promise<Map<string, GoogleResult>> {
  const result = new Map<string, GoogleResult>();
  let cursor = 0;
  let authError: GoogleAuthError | null = null;

  async function worker() {
    while (cursor < rows.length && !authError) {
      const row = rows[cursor++];

      try {
        result.set(row.siret, await searchOne(row, apiKey));
      } catch (err) {
        if (err instanceof GoogleAuthError) {
          authError = err;
          return;
        }
        throw err;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  if (authError) throw authError;

  return result;
}
