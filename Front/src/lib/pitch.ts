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
  "1071C": {
    activity: "une boulangerie-pâtisserie",
    painPoint:
      "vos clients ne trouvent pas vos horaires ni vos spécialités en ligne avant de passer devant chez vous",
    offer: "un site vitrine avec horaires à jour et vos spécialités mises en avant",
    proofPoint:
      "un site e-commerce avec commande en ligne pour un commerce alimentaire (paiement intégré, click & collect)",
  },
  "9602A": {
    activity: "un salon de coiffure",
    painPoint:
      "vos client(e)s ne trouvent pas vos horaires ni comment prendre rendez-vous en ligne, et réservent chez un concurrent qui a un site",
    offer: "un site vitrine avec prise de rendez-vous en ligne",
    proofPoint:
      "un système de réservation en ligne (créneaux, rappels, clients) livré à un salon de coiffure",
  },
  "9602B": {
    activity: "un institut de beauté",
    painPoint:
      "vos client(e)s ne trouvent pas vos prestations ni vos disponibilités en ligne avant de réserver ailleurs",
    offer: "un site vitrine avec prise de rendez-vous en ligne",
    proofPoint:
      "un système de réservation en ligne (créneaux, rappels, clients) livré à un institut de beauté",
  },
  "4321A": {
    activity: "un électricien",
    painPoint:
      "vos prospects ne trouvent pas vos coordonnées ni vos avis en ligne, et appellent un concurrent mieux référencé sur Google",
    offer: "un site vitrine avec formulaire de devis et mise en avant de vos avis clients",
    proofPoint: "un site vitrine avec formulaire de devis livré à un artisan du bâtiment",
  },
  "4322A": {
    activity: "un plombier-chauffagiste",
    painPoint:
      "vos prospects ne trouvent pas vos coordonnées ni vos avis en ligne, et appellent un concurrent mieux référencé sur Google",
    offer: "un site vitrine avec formulaire de devis et numéro d'urgence bien visible",
    proofPoint: "un site vitrine avec formulaire de devis livré à un artisan du bâtiment",
  },
  "4332A": {
    activity: "un menuisier",
    painPoint:
      "vos réalisations ne sont visibles nulle part en ligne pour rassurer de nouveaux clients avant de vous contacter",
    offer: "un site vitrine avec galerie de réalisations et formulaire de devis",
    proofPoint: "un site vitrine avec galerie de réalisations livré à un artisan du bâtiment",
  },
  "4334Z": {
    activity: "un peintre en bâtiment",
    painPoint:
      "vos réalisations ne sont visibles nulle part en ligne pour rassurer de nouveaux clients avant de vous contacter",
    offer: "un site vitrine avec galerie de réalisations et formulaire de devis",
    proofPoint: "un site vitrine avec galerie de réalisations livré à un artisan du bâtiment",
  },
  "9604Z": {
    activity: "un spa / institut de bien-être",
    painPoint:
      "vos clients ne trouvent pas vos soins ni vos disponibilités en ligne, et réservent chez un concurrent qui a un site",
    offer: "un site vitrine avec réservation de soins en ligne",
    proofPoint:
      "un système de réservation en ligne (créneaux, rappels, clients) livré à un institut de bien-être",
  },
  "9313Z": {
    activity: "une salle de sport",
    painPoint:
      "vos prospects ne trouvent pas votre planning de cours ni vos tarifs en ligne avant de s'inscrire ailleurs",
    offer: "un site vitrine avec réservation de cours et de séances d'essai en ligne",
    proofPoint:
      "un système de réservation en ligne (créneaux, cours, clients) livré à une salle de sport",
  },
  "8551Z": {
    activity: "un centre de cours sportifs/danse/yoga",
    painPoint:
      "vos prospects ne trouvent pas votre planning de cours en ligne et s'inscrivent chez un concurrent plus visible",
    offer: "un site vitrine avec réservation de cours en ligne",
    proofPoint:
      "un système de réservation en ligne (créneaux, cours, clients) livré à un centre d'activités sportives",
  },
  "9329Z": {
    activity: "un centre de loisirs",
    painPoint:
      "vos clients ne peuvent pas réserver un créneau en ligne et vont chez un concurrent qui le propose",
    offer: "un site vitrine avec réservation de créneaux en ligne",
    proofPoint:
      "un système de réservation en ligne (créneaux, caisse, clients) livré à un centre de loisirs",
  },
  "5510Z": {
    activity: "un hôtel",
    painPoint:
      "vous dépendez entièrement des plateformes de réservation (Booking, Airbnb...) qui prennent une commission sur chaque nuitée",
    offer: "un site vitrine avec moteur de réservation directe, sans commission",
    proofPoint: "un moteur de réservation en ligne livré à un établissement d'hébergement",
  },
  "5520Z": {
    activity: "un gîte / une chambre d'hôtes",
    painPoint:
      "vous dépendez entièrement des plateformes de réservation (Booking, Airbnb...) qui prennent une commission sur chaque nuitée",
    offer: "un site vitrine avec moteur de réservation directe, sans commission",
    proofPoint: "un moteur de réservation en ligne livré à un établissement d'hébergement",
  },
  "8230Z": {
    activity: "un organisateur d'événements",
    painPoint:
      "vos prospects ne trouvent pas vos disponibilités ni vos formules en ligne avant de réserver ailleurs",
    offer: "un site vitrine avec demande de devis et réservation de dates en ligne",
    proofPoint:
      "un système de réservation en ligne (créneaux, devis, clients) livré à un prestataire événementiel",
  },
};

const FALLBACK_PITCH: SectorPitch = {
  activity: "un commerce",
  painPoint: "vos clients ne trouvent pas facilement vos informations en ligne",
  offer: "un site vitrine simple et efficace",
  proofPoint: "plusieurs sites livrés à des commerces locaux",
};

export function getSectorPitch(naf?: string, freeText?: string): SectorPitch {
  const clean = naf?.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (clean && clean in SECTOR_PITCHES) return SECTOR_PITCHES[clean as NafCode];

  const secteur = freeText?.trim();
  if (secteur) return { ...FALLBACK_PITCH, activity: `un(e) ${secteur.toLowerCase()}` };

  return FALLBACK_PITCH;
}
