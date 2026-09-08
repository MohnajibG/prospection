import { useState } from "react";
import type { SireneEtablissement } from "../types";
import {
  IconCheck,
  IconClose,
  IconCopy,
  IconFacebook,
  IconInstagram,
  IconMaps,
} from "./Icons";

export default function SiretModal({
  etab,
  onClose,
}: {
  etab: SireneEtablissement | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!etab) return null;

  const name = etab.denominationUniteLegale || etab.nomUniteLegale || "Établissement";
  const city = etab.libelleCommuneEtablissement ?? "";
  const postal = etab.codePostalEtablissement ?? "";
  const address = etab.adresse ?? "";

  const qBase = `${name} ${address} ${postal} ${city}`.trim();

  const open = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onGoogle = () => {
    const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      qBase || name || etab.siret,
    )}`;
    open(maps);
  };

  const onFacebook = () => {
    const fb = `https://www.google.com/search?q=${encodeURIComponent(
      `${qBase} site:facebook.com`,
    )}`;
    open(fb);
  };

  const onInstagram = () => {
    const ig = `https://www.google.com/search?q=${encodeURIComponent(
      `${qBase} site:instagram.com`,
    )}`;
    open(ig);
  };

  const onCopySiret = async () => {
    try {
      await navigator.clipboard.writeText(etab.siret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{name}</h2>
            <div className="modal-address">
              {address && <div>{address}</div>}
              <div>
                {postal} {city}
              </div>
            </div>

            <div className="modal-siret-row">
              <code>{etab.siret}</code>
              <button className="icon-btn" onClick={onCopySiret} title="Copier le SIRET">
                {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
              </button>
            </div>
          </div>

          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <IconClose size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p>Choisis un canal pour rechercher des coordonnées / présence en ligne :</p>

          <div className="channel-grid">
            <button className="channel-btn" onClick={onGoogle}>
              <IconMaps size={20} />
              Google / Maps
            </button>

            <button className="channel-btn" onClick={onFacebook}>
              <IconFacebook size={20} />
              Facebook
            </button>

            <button className="channel-btn" onClick={onInstagram}>
              <IconInstagram size={20} />
              Instagram
            </button>
          </div>

          <div className="modal-tip">
            Astuce : commence par Google / Maps pour trouver la fiche
            (téléphone, site), puis vérifie Facebook/Instagram pour l'email
            ou WhatsApp.
          </div>
        </div>
      </div>
    </div>
  );
}
