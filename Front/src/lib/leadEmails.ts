// Ni SIRENE ni Google Places ne donnent d'email (structurel : ces leads sont
// justement les commerces sans site web, donc rien à en extraire) — l'email
// se tape à la main. On le mémorise par SIRET pour ne pas le retaper à
// chaque réouverture de la fiche.
const STORAGE_KEY = "sirene_lead_emails";

export function getLeadEmails(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setLeadEmail(
  emails: Record<string, string>,
  siret: string,
  email: string,
): Record<string, string> {
  const next = { ...emails, [siret]: email };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
