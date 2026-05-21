import { useState } from "react";
import { fetchEtablissementBySiret } from "../lib/sirene";
import { SireneEtablissement } from "../types";

export default function SiretSearch({
  apiKey,
  onFound,
}: {
  apiKey: string;
  onFound: (e: SireneEtablissement) => void;
}) {
  const [siret, setSiret] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setMsg(null);

    try {
      const e = await fetchEtablissementBySiret(siret, apiKey);

      if (!e) {
        setMsg("Aucun établissement trouvé pour ce SIRET.");
      } else {
        onFound(e);
        setMsg("✅ Adresse trouvée et ajoutée !");
        setSiret("");
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card row" style={{ gap: 8, alignItems: "end" }}>
      <div style={{ flex: 1 }}>
        <label>Recherche par SIRET</label>
        <input
          placeholder="ex: 99394626800014"
          value={siret}
          onChange={(e) => setSiret(e.target.value)}
        />
        <small>Colle un SIRET (14 chiffres) pour récupérer l’adresse.</small>
      </div>

      <button className="btn" onClick={run} disabled={loading || !siret.trim()}>
        {loading ? "Recherche..." : "Trouver l’adresse"}
      </button>

      {msg && (
        <div className="muted" style={{ marginLeft: 8, whiteSpace: "nowrap" }}>
          {msg}
        </div>
      )}
    </div>
  );
}
