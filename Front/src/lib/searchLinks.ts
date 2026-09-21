// Recherche Google ciblée : fait souvent remonter un email public (fiche
// Facebook, TheFork/TripAdvisor, article de presse...) même quand
// l'établissement n'a pas de site. Pas garanti, mais gratuit et rapide.
export function buildEmailSearchUrl(name: string, city?: string): string {
  const q = [`"${name}"`, city, "email"].filter(Boolean).join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}
