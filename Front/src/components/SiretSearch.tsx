import { useState } from "react";
import { fetchEtablissementBySiret } from "../api/sirene";
import { SireneEtablissement } from "../types";
import { IconAlert, IconCheck, IconSpinner } from "./Icons";

export default function SiretSearch({
  onFound,
}: {
  onFound: (e: SireneEtablissement) => void;
}) {
  const [siret, setSiret] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const run = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const e = await fetchEtablissementBySiret(siret);

      if (!e) {
        setStatus({ ok: false, text: "Aucun établissement trouvé pour ce SIRET." });
      } else {
        onFound(e);
        setStatus({ ok: true, text: "Adresse trouvée et ajoutée !" });
        setSiret("");
      }
    } catch (err: any) {
      setStatus({ ok: false, text: err?.message ?? "Erreur" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card row" style={{ gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="field" style={{ flex: 1, minWidth: 240 }}>
        <label>Recherche par SIRET</label>
        <input
          placeholder="ex: 99394626800014"
          value={siret}
          onChange={(e) => setSiret(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && siret.trim() && !loading) run();
          }}
        />
        <small>Colle un SIRET (14 chiffres) pour récupérer l'adresse.</small>
      </div>

      <button
        className="btn secondary"
        onClick={run}
        disabled={loading || !siret.trim()}
      >
        {loading && <IconSpinner size={15} />}
        {loading ? "Recherche..." : "Trouver l'adresse"}
      </button>

      {status && (
        <span className={`status-msg ${status.ok ? "success" : "error"}`}>
          {status.ok ? <IconCheck size={15} /> : <IconAlert size={15} />}
          {status.text}
        </span>
      )}
    </div>
  );
}
