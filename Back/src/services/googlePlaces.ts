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

export type AreaSearchInput = {
  secteur: string;
  ville: string;
  codePostal?: string;
};

export type AreaPlaceResult = {
  placeId: string;
  nom?: string;
  adresse?: string;
  codePostal?: string;
  commune?: string;
  telephone?: string;
  siteWeb?: string;
  hasWebsite: boolean;
  rating?: number;
  ratingCount?: number;
};

const AREA_FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.addressComponents," +
  "places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount," +
  "nextPageToken";

const AREA_MAX_PAGES = 3;
// Google exige un court délai avant qu'un nextPageToken devienne utilisable.
const AREA_PAGE_TOKEN_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function addressComponent(place: any, type: string): string | undefined {
  const comp = place.addressComponents?.find((c: any) => c.types?.includes(type));
  return comp?.longText;
}

function mapAreaPlace(place: any): AreaPlaceResult {
  return {
    placeId: place.id,
    nom: place.displayName?.text,
    adresse: place.formattedAddress,
    codePostal: addressComponent(place, "postal_code"),
    commune: addressComponent(place, "locality"),
    telephone: place.nationalPhoneNumber,
    siteWeb: place.websiteUri,
    hasWebsite: !!place.websiteUri,
    rating: place.rating,
    ratingCount: place.userRatingCount,
  };
}

export async function searchAreaGooglePlaces(
  input: AreaSearchInput,
  apiKey: string,
): Promise<AreaPlaceResult[]> {
  const textQuery = [input.secteur, input.ville, input.codePostal]
    .filter(Boolean)
    .join(" ");

  const byId = new Map<string, AreaPlaceResult>();
  let pageToken: string | undefined;

  for (let page = 0; page < AREA_MAX_PAGES; page++) {
    if (page > 0) {
      if (!pageToken) break;
      await sleep(AREA_PAGE_TOKEN_DELAY_MS);
    }

    const res = await fetch(TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": AREA_FIELD_MASK,
      },
      body: JSON.stringify(
        pageToken
          ? { pageToken }
          : { textQuery, languageCode: "fr", regionCode: "FR", maxResultCount: 20 },
      ),
    });

    if (res.status === 401 || res.status === 403) {
      const txt = await res.text();
      console.error("GOOGLE PLACES AUTH ERROR:", { status: res.status, body: txt });
      throw new GoogleAuthError(
        "Clé Google Places invalide, ou API \"Places API (New)\" non activée sur le projet Google Cloud — vérifie GOOGLE_PLACES_API_KEY dans Back/.env.",
      );
    }

    if (!res.ok) {
      const txt = await res.text();
      console.error("GOOGLE PLACES AREA ERROR:", { status: res.status, body: txt });
      break;
    }

    const data = await res.json();
    for (const place of data.places ?? []) {
      const mapped = mapAreaPlace(place);
      if (mapped.placeId) byId.set(mapped.placeId, mapped);
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return Array.from(byId.values());
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
