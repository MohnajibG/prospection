import { NafCode, SearchParams } from "../types";
import { IconSearch, IconSpinner } from "./Icons";

const ALL_NAF: { code: NafCode; label: string }[] = [
  { code: "5610A", label: "Restaurant traditionnel" },
  { code: "5610B", label: "Cafétéria / restauration collective" },
  { code: "5610C", label: "Restauration rapide" },
  { code: "5630Z", label: "Débit de boisson" },
  { code: "5621Z", label: "Traiteur" },
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
    <div className="card grid" style={{ gap: 20 }}>
      <div className="field-grid">
        <div className="field">
          <label>Zone de recherche</label>
          <div className="segmented">
            <button
              type="button"
              className={!value.nationwide ? "active" : ""}
              onClick={() => onChange({ ...value, nationwide: false })}
            >
              Département
            </button>
            <button
              type="button"
              className={value.nationwide ? "active" : ""}
              onClick={() => onChange({ ...value, nationwide: true })}
            >
              Toute la France
            </button>
          </div>
        </div>

        <div className="field">
          <label>Département / préfixe CP</label>
          <input
            placeholder="75, 69, 13..."
            value={value.postalPrefix}
            disabled={value.nationwide}
            onChange={(e) =>
              onChange({ ...value, postalPrefix: e.target.value.trim() })
            }
          />
          <small>Ex : 75* = Paris, 92* = Hauts-de-Seine</small>
        </div>

        <div className="field">
          <label>Créés il y a moins de (jours)</label>
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

        <div className="field">
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

      <hr className="divider" />

      <div className="field">
        <label>Activités ciblées (NAF)</label>
        <div className="chip-group">
          {ALL_NAF.map((n) => {
            const active = value.nafCodes.includes(n.code);
            return (
              <button
                type="button"
                key={n.code}
                className={`chip ${active ? "active" : ""}`}
                onClick={() => toggleNaf(n.code)}
                aria-pressed={active}
              >
                {n.label}
                <span className="chip-code">{n.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button className="btn" onClick={onSubmit} disabled={loading}>
        {loading ? <IconSpinner size={16} /> : <IconSearch size={16} />}
        {loading ? "Recherche en cours..." : "Trouver les nouveaux établissements"}
      </button>
    </div>
  );
}
