import { NafCode, SearchParams } from "../types";

const ALL_NAF: { code: NafCode; label: string }[] = [
  { code: "5610A", label: "Restaurant traditionnel (56.10A)" },
  { code: "5610B", label: "Cafétéria / restauration collective (56.10B)" },
  { code: "5610C", label: "Restauration rapide (56.10C)" },
  { code: "5630Z", label: "Débit de boisson (56.30Z)" },
  { code: "5621Z", label: "Traiteur (56.21Z)" },
];

type Props = {
  value: SearchParams;
  onChange: (v: SearchParams) => void;
  onSubmit: () => void;
  loading: boolean;
};

export default function Filters({ value, onChange, onSubmit, loading }: Props) {
  const toggleNaf = (code: NafCode) => {
    const has = value.nafCodes.includes(code);
    const nafCodes = has
      ? value.nafCodes.filter((c) => c !== code)
      : [...value.nafCodes, code];

    onChange({ ...value, nafCodes });
  };

  return (
    <div className="card grid" style={{ gap: 14 }}>
      <div className="grid cols-3">
        {/* ✅ Zone de recherche */}
        <div>
          <label>Zone de recherche</label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={value.nationwide}
              onChange={(e) =>
                onChange({ ...value, nationwide: e.target.checked })
              }
              style={{ width: 16, height: 16 }}
            />
            <span>Toute la France</span>
          </label>
          <small>
            Si activé, le filtre département est ignoré et tu filtres après.
          </small>
        </div>

        {/* ✅ Département / CP */}
        <div>
          <label>Département / préfixe CP</label>
          <input
            placeholder="75, 69, 13..."
            value={value.postalPrefix}
            disabled={value.nationwide}
            onChange={(e) =>
              onChange({ ...value, postalPrefix: e.target.value.trim() })
            }
          />
          <small>Ex: 75* = Paris, 92* = Hauts-de-Seine</small>
        </div>

        {/* ✅ Fenêtre temps */}
        <div>
          <label>Créés il y a moins de ... jours</label>
          <input
            type="number"
            min={1}
            max={365}
            value={value.daysBack}
            onChange={(e) =>
              onChange({ ...value, daysBack: Number(e.target.value) })
            }
          />
        </div>

        {/* ✅ Pagination */}
        <div>
          <label>Résultats par page</label>
          <select
            value={value.perPage}
            onChange={(e) =>
              onChange({ ...value, perPage: Number(e.target.value) })
            }
          >
            {[50, 100, 200].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ✅ NAF */}
      <div>
        <label>Activités ciblées</label>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {ALL_NAF.map((n) => (
            <label
              key={n.code}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginRight: 12,
              }}
            >
              <input
                type="checkbox"
                checked={value.nafCodes.includes(n.code)}
                onChange={() => toggleNaf(n.code)}
                style={{ width: 16, height: 16 }}
              />
              <span>{n.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ✅ Action */}
      <div className="row">
        <button className="btn" onClick={onSubmit} disabled={loading}>
          {loading ? "Recherche..." : "Trouver les nouveaux établissements"}
        </button>
      </div>
    </div>
  );
}
