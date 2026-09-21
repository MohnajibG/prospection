// Formes juridiques et mots vides à ignorer : le nom légal SIRENE ("SASU
// ZENZAN") ne correspond quasiment jamais mot pour mot au nom commercial
// affiché sur Google/OSM ("Zenzan Sushi Bar") — on compare sur les mots
// significatifs communs plutôt que sur une inclusion stricte des chaînes.
const STOPWORDS = new Set([
  "sasu", "sas", "sarl", "eurl", "sci", "sa", "snc", "ei",
  "le", "la", "les", "du", "de", "des", "et", "au", "aux", "un", "une",
]);

const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function significantWords(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

export function nameSimilar(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na.length < 3 || nb.length < 3) return false;
  if (na.includes(nb) || nb.includes(na)) return true;

  const wa = significantWords(a);
  const wb = significantWords(b);
  if (wa.length === 0 || wb.length === 0) return false;

  return wa.some((w) => wb.includes(w));
}
