export type SenderProfile = {
  name: string;
  title: string;
  website: string;
  maltUrl: string;
  phone: string;
  email: string;
};

const STORAGE_KEY = "sirene_sender_profile";

const DEFAULT_PROFILE: SenderProfile = {
  name: "Najib Guerchaoui",
  title: "Développeur web freelance",
  website: "https://mngdev.pro/home",
  maltUrl: "https://www.malt.fr/profile/najibguerchaoui",
  phone: "",
  email: "",
};

export function getSenderProfile(): SenderProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveSenderProfile(profile: SenderProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
