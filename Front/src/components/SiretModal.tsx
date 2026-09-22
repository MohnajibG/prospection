import { useState } from "react";
import type { SireneEtablissement } from "../types";
import { buildEmailSearchUrl } from "../lib/searchLinks";
import {
  IconCheck,
  IconClose,
  IconCopy,
  IconExternal,
  IconFacebook,
  IconInstagram,
  IconMail,
  IconMaps,
  IconPhone,
  IconSearch,
} from "./Icons";

function PresenceStatus({
  etab,
  onMessageClick,
}: {
  etab: SireneEtablissement;
  onMessageClick?: (row: SireneEtablissement) => void;
}) {
  if (etab.presenceWeb === "sans_site") {
    return (
      <div className="modal-status modal-status--lead">
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <div>
            <span className="badge lead">🎯 Pas de site (vérifié via Google)</span>
            {etab.telephone && (
              <a href={`tel:${etab.telephone}`} className="siret-btn" style={{ marginTop: 8 }}>
                <IconPhone size={13} />
                {etab.telephone}
              </a>
            )}
          </div>

          <button
            type="button"
            className="btn"
            onClick={() => onMessageClick?.(etab)}
          >
            <IconMail size={15} />
            Message
          </button>
        </div>
      </div>
    );
  }

  if (etab.presenceWeb === "avec_site") {
    return (
      <div className="modal-status">
        <span className="muted" style={{ fontSize: 12.5 }}>
          Vérifié via Google — a déjà un site
        </span>
        <div className="row" style={{ marginTop: 6, gap: 14, flexWrap: "wrap" }}>
          {etab.siteWeb && (
            <a href={etab.siteWeb} target="_blank" rel="noopener noreferrer" className="siret-btn">
              {etab.siteWeb.replace(/^https?:\/\//, "")}
              <IconExternal size={12} />
            </a>
          )}
          {etab.telephone && (
            <a href={`tel:${etab.telephone}`} className="siret-btn">
              <IconPhone size={13} />
              {etab.telephone}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="modal-status">
      <span className="muted" style={{ fontSize: 12.5 }}>
        Pas encore vérifié via Google — utilise "Revérifier la présence web", ou
        cherche manuellement ci-dessous.
      </span>
    </div>
  );
}

export default function SiretModal({
  etab,
  onClose,
  onMessageClick,
}: {
  etab: SireneEtablissement | null;
  onClose: () => void;
  onMessageClick?: (row: SireneEtablissement) => void;
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

  const onSearchEmail = () => {
    open(buildEmailSearchUrl(name, city));
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

            {etab.rating != null && (
              <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                ⭐ {etab.rating} {etab.ratingCount != null && `(${etab.ratingCount} avis)`}
              </div>
            )}

            <div className="modal-siret-row">
              <span className="muted" style={{ fontSize: 11 }}>
                {etab.source === "maps" ? "ID Google Maps" : "SIRET"}
              </span>
              <code>{etab.siret}</code>
              <button
                className="icon-btn"
                onClick={onCopySiret}
                title={etab.source === "maps" ? "Copier l'ID" : "Copier le SIRET"}
              >
                {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
              </button>
            </div>
          </div>

          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <IconClose size={18} />
          </button>
        </div>

        <div className="modal-body">
          <PresenceStatus etab={etab} onMessageClick={onMessageClick} />

          <p style={{ marginTop: 16 }}>
            Recherche manuelle complémentaire (email, WhatsApp...) :
          </p>

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

            <button className="channel-btn" onClick={onSearchEmail}>
              <IconSearch size={20} />
              Chercher l'email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
