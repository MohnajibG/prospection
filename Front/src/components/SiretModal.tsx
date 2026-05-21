import type { SireneEtablissement } from "../types";

export default function SiretModal({
  etab,
  onClose,
}: {
  etab: SireneEtablissement | null;
  onClose: () => void;
}) {
  if (!etab) return null;

  const name = etab.denominationUniteLegale || etab.nomUniteLegale || "";
  const city = etab.libelleCommuneEtablissement ?? "";
  const postal = etab.codePostalEtablissement ?? "";
  const address = etab.adresse ?? "";

  const qBase = `${name} ${address} ${postal} ${city}`.trim();

  const open = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onGoogle = () => {
    // ouvre Google Maps search (pratique pour trouver la fiche)
    const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      qBase || name || etab.siret
    )}`;
    open(maps);
  };

  const onFacebook = () => {
    // recherche Facebook via Google site:facebook.com
    const fb = `https://www.google.com/search?q=${encodeURIComponent(
      `${qBase} site:facebook.com`
    )}`;
    open(fb);
  };

  const onInstagram = () => {
    // recherche Instagram via Google site:instagram.com
    const ig = `https://www.google.com/search?q=${encodeURIComponent(
      `${qBase} site:instagram.com`
    )}`;
    open(ig);
  };

  const onCopySiret = async () => {
    try {
      await navigator.clipboard.writeText(etab.siret);
      // pas de toast ici (léger), tu peux intégrer un toast si tu veux
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: "95%",
          background: "white",
          borderRadius: 8,
          padding: 18,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 6px 0" }}>{name || "Établissement"}</h2>
            <div style={{ color: "#666", fontSize: 13 }}>
              {address ? <div>{address}</div> : null}
              <div>
                {postal} {city}
              </div>
              <div style={{ marginTop: 6 }}>
                <strong>SIRET :</strong>{" "}
                <code
                  style={{
                    background: "#f3f3f3",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {etab.siret}
                </code>
                <button
                  onClick={onCopySiret}
                  style={{
                    marginLeft: 8,
                    padding: "4px 8px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Copier
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              style={{
                background: "transparent",
                border: "none",
                fontSize: 20,
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        </header>

        <main style={{ marginTop: 14 }}>
          <p style={{ marginTop: 0, color: "#333" }}>
            Choisis un canal pour rechercher des coordonnées / présence en ligne
            :
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              className="btn"
              onClick={onGoogle}
              style={{ flex: 1, padding: "10px 12px", cursor: "pointer" }}
            >
              🔎 Google / Maps
            </button>

            <button
              className="btn"
              onClick={onFacebook}
              style={{ flex: 1, padding: "10px 12px", cursor: "pointer" }}
            >
              📘 Facebook
            </button>

            <button
              className="btn"
              onClick={onInstagram}
              style={{ flex: 1, padding: "10px 12px", cursor: "pointer" }}
            >
              📸 Instagram
            </button>
          </div>

          <div style={{ marginTop: 12, color: "#666", fontSize: 13 }}>
            Astuce : commence par Google / Maps pour trouver la fiche
            (téléphone, site), puis vérifie Facebook/Instagram pour email ou
            WhatsApp.
          </div>
        </main>
      </div>
    </div>
  );
}
