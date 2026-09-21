import type { SireneEtablissement } from "../types";
import type { SenderProfile } from "./senderProfile";
import { getSectorPitch } from "./pitch";

export type OutreachMessage = {
  subject: string;
  body: string;
};

export function buildOutreachMessage(
  etab: SireneEtablissement,
  profile: SenderProfile,
): OutreachMessage {
  const name = etab.denominationUniteLegale || etab.nomUniteLegale || "votre établissement";
  const commune = etab.libelleCommuneEtablissement;
  const pitch = getSectorPitch(etab.activitePrincipaleEtablissement);

  const subject = `Un site web pour ${name} ?`;

  const opening = commune
    ? `Je suis tombé sur ${name}, ${pitch.activity} qui vient d'ouvrir à ${commune} — félicitations pour le lancement !`
    : `Je suis tombé sur ${name}, ${pitch.activity} qui vient d'ouvrir — félicitations pour le lancement !`;

  const signatureLines = [
    "",
    "Bien à vous,",
    profile.name,
    profile.title,
    profile.website,
    profile.maltUrl,
  ];
  if (profile.phone) signatureLines.push(profile.phone);

  const body = [
    "Bonjour,",
    "",
    opening,
    "",
    `Je remarque que vous n'avez pas encore de site en ligne. Concrètement, ${pitch.painPoint}.`,
    "",
    `Je suis ${profile.title.toLowerCase()} et j'accompagne des commerces comme le vôtre avec ${pitch.offer}. J'ai récemment livré ${pitch.proofPoint} — je peux vous montrer des exemples concrets.`,
    "",
    `Si ça vous intéresse, je vous propose un premier échange rapide (15 min, sans engagement) pour voir ce qui ferait le plus sens pour ${name}.`,
    ...signatureLines,
  ].join("\n");

  return { subject, body };
}

/**
 * Regroupe plusieurs messages dans un seul fichier texte lisible — un
 * tableur (CSV/Excel) n'est pas adapté à du texte libre multi-paragraphes :
 * séparateurs, retours à la ligne et accents s'y mélangent mal selon les
 * logiciels. Un .txt simple s'ouvre et se copie sans surprise partout.
 */
export function toOutreachText(
  entries: { row: SireneEtablissement; subject: string; body: string }[],
): string {
  return entries
    .map(({ row, subject, body }) => {
      const nom = row.denominationUniteLegale || row.nomUniteLegale || "Établissement";
      const ville = row.libelleCommuneEtablissement;
      const tel = row.telephone;

      const heading = [nom, ville, tel].filter(Boolean).join(" — ");

      return [
        "=".repeat(60),
        heading,
        `SIRET : ${row.siret}`,
        "",
        `Objet : ${subject}`,
        "",
        body,
      ].join("\n");
    })
    .join("\n\n\n");
}
