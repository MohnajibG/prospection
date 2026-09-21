import type { NafCode } from "../types";

export type SectorPitch = {
  /** Comment désigner le commerce dans une phrase ("un restaurant", "un traiteur"...) */
  activity: string;
  /** Ce que le manque de site web leur coûte concrètement */
  painPoint: string;
  /** Ce qu'on leur propose */
  offer: string;
  /** Référence à une réalisation proche pour crédibiliser l'approche */
  proofPoint: string;
};

const SECTOR_PITCHES: Record<NafCode, SectorPitch> = {
  "5610A": {
    activity: "un restaurant",
    painPoint:
      "vos futurs clients ne trouvent ni votre carte à jour ni vos horaires en ligne, et vont chez le voisin qui a un site",
    offer: "un site vitrine avec carte à jour, horaires et réservation en ligne",
    proofPoint:
      "un site e-commerce avec commande en ligne pour un restaurant/café (paiement intégré, menu interactif)",
  },
  "5610B": {
    activity: "un établissement",
    painPoint:
      "vos clients ne trouvent pas votre carte ni vos horaires en ligne avant de se déplacer",
    offer: "un site vitrine simple avec carte à jour et horaires",
    proofPoint:
      "un site e-commerce avec commande en ligne pour un restaurant/café (paiement intégré, menu interactif)",
  },
  "5610C": {
    activity: "un restaurant",
    painPoint:
      "vous perdez des commandes en click & collect que vos concurrents captent avec un site",
    offer: "un site de commande en ligne / click & collect",
    proofPoint:
      "un site e-commerce avec commande en ligne pour un restaurant/café (paiement intégré, menu interactif)",
  },
  "5630Z": {
    activity: "un établissement",
    painPoint:
      "vos clients ne trouvent pas vos horaires, votre carte, ni comment réserver une soirée ou un événement",
    offer: "un site vitrine avec réservation de soirées/événements en ligne",
    proofPoint:
      "un système de réservation en ligne (créneaux, caisse, clients) livré à un commerce fonctionnant par rendez-vous",
  },
  "5621Z": {
    activity: "un traiteur",
    painPoint:
      "vous recevez encore toutes les demandes de devis par téléphone ou message, sans suivi centralisé",
    offer: "un site vitrine avec formulaire de devis et réservation en ligne",
    proofPoint:
      "un système de réservation en ligne (créneaux, caisse, clients) livré à un commerce fonctionnant par rendez-vous",
  },
};

const FALLBACK_PITCH: SectorPitch = {
  activity: "un commerce",
  painPoint: "vos clients ne trouvent pas facilement vos informations en ligne",
  offer: "un site vitrine simple et efficace",
  proofPoint: "plusieurs sites livrés à des commerces locaux",
};

export function getSectorPitch(naf?: string): SectorPitch {
  const clean = naf?.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (clean && clean in SECTOR_PITCHES) return SECTOR_PITCHES[clean as NafCode];
  return FALLBACK_PITCH;
}
