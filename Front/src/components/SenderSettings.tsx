import { useEffect, useState, type ChangeEvent } from "react";
import type { SenderProfile } from "../lib/senderProfile";
import { IconClose } from "./Icons";

export default function SenderSettings({
  open,
  profile,
  onSave,
  onClose,
}: {
  open: boolean;
  profile: SenderProfile;
  onSave: (p: SenderProfile) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<SenderProfile>(profile);

  useEffect(() => {
    if (open) setDraft(profile);
  }, [open, profile]);

  if (!open) return null;

  const update = (key: keyof SenderProfile) => (e: ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  const submit = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Mes coordonnées</h2>
            <div className="modal-address">
              Utilisées pour signer les messages de prospection générés.
            </div>
          </div>

          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <IconClose size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="grid" style={{ gap: 12 }}>
            <div className="field">
              <label>Nom</label>
              <input value={draft.name} onChange={update("name")} />
            </div>
            <div className="field">
              <label>Métier / titre</label>
              <input value={draft.title} onChange={update("title")} />
            </div>
            <div className="field">
              <label>Site web</label>
              <input value={draft.website} onChange={update("website")} />
            </div>
            <div className="field">
              <label>Profil Malt</label>
              <input value={draft.maltUrl} onChange={update("maltUrl")} />
            </div>
            <div className="field">
              <label>Téléphone (optionnel)</label>
              <input value={draft.phone} onChange={update("phone")} />
            </div>
            <div className="field">
              <label>Email (optionnel)</label>
              <input value={draft.email} onChange={update("email")} />
            </div>
          </div>

          <button className="btn block" style={{ marginTop: 16 }} onClick={submit}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
