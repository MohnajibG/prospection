import { useEffect, useState } from "react";
import type { SireneEtablissement } from "../types";
import type { SenderProfile } from "../lib/senderProfile";
import { buildOutreachMessage } from "../lib/messageTemplate";
import { buildGmailComposeUrl } from "../lib/gmail";
import { IconCheck, IconClose, IconCopy, IconMail, IconPhone } from "./Icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MessageModal({
  etab,
  profile,
  email,
  isContacted,
  onEmailChange,
  onToggleContacted,
  onClose,
}: {
  etab: SireneEtablissement | null;
  profile: SenderProfile;
  email: string;
  isContacted: boolean;
  onEmailChange: (siret: string, email: string) => void;
  onToggleContacted?: (siret: string) => void;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState<"all" | null>(null);

  useEffect(() => {
    if (!etab) return;
    const msg = buildOutreachMessage(etab, profile);
    setSubject(msg.subject);
    setBody(msg.body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etab?.siret]);

  if (!etab) return null;

  const name = etab.denominationUniteLegale || etab.nomUniteLegale || "cet établissement";
  const emailValid = EMAIL_RE.test(email.trim());

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopied("all");
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // ignore
    }
  };

  const sendViaGmail = () => {
    if (!emailValid) return;
    window.open(buildGmailComposeUrl(email.trim(), subject, body), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-panel modal-panel--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Message pour {name}</h2>
            <div className="modal-address">
              Généré automatiquement — modifie le texte avant de l'envoyer.
            </div>
          </div>

          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <IconClose size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Email destinataire</label>
            <input
              type="email"
              placeholder="contact@exemple.fr"
              value={email}
              onChange={(e) => onEmailChange(etab.siret, e.target.value)}
            />
            <small>
              Ni SIRENE ni Google ne donnent l'email de ce type de commerce — à trouver
              manuellement (site, réseaux sociaux) et à saisir ici.
            </small>
          </div>

          <div className="field" style={{ marginTop: 14 }}>
            <label>Objet</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="field" style={{ marginTop: 14 }}>
            <label>Message</label>
            <textarea
              className="message-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={11}
            />
          </div>

          <div className="row between" style={{ marginTop: 14, flexWrap: "wrap" }}>
            {etab.telephone ? (
              <a href={`tel:${etab.telephone}`} className="btn secondary">
                <IconPhone size={15} />
                Appeler {etab.telephone}
              </a>
            ) : (
              <span />
            )}

            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => onToggleContacted?.(etab.siret)}
              >
                {isContacted ? <IconClose size={15} /> : <IconCheck size={15} />}
                {isContacted ? "Retirer « contacté »" : "Marquer comme contacté"}
              </button>

              <button className="btn secondary" onClick={copyAll}>
                {copied === "all" ? <IconCheck size={15} /> : <IconCopy size={15} />}
                Copier
              </button>

              <button
                className="btn"
                onClick={sendViaGmail}
                disabled={!emailValid}
                title={emailValid ? "" : "Renseigne un email destinataire valide"}
              >
                <IconMail size={15} />
                Envoyer par Gmail
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
