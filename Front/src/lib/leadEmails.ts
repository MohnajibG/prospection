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
