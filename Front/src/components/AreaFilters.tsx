import { AreaSearchParams } from "../types";
import { IconSearch, IconSpinner } from "./Icons";

type Props = {
  value: AreaSearchParams;
  onChange: (v: AreaSearchParams) => void;
  onSubmit: () => void;
  loading: boolean;
};

export default function AreaFilters({ value, onChange, onSubmit, loading }: Props) {
  const canSubmit = value.secteur.trim() && value.ville.trim();

  return (
    <div className="card grid" style={{ gap: 20 }}>
      <div className="field-grid">
        <div className="field">
          <label>Secteur d'activité</label>
          <input
            placeholder="Plombier, coiffeur, boulangerie..."
            value={value.secteur}
            onChange={(e) => onChange({ ...value, secteur: e.target.value })}
          />
          <small>Texte libre, comme une recherche Google Maps.</small>
        </div>

        <div className="field">
          <label>Ville</label>
          <input
            placeholder="Lyon, Bordeaux..."
            value={value.ville}
            onChange={(e) => onChange({ ...value, ville: e.target.value })}
          />
        </div>

        <div className="field">
          <label>Code postal (optionnel)</label>
          <input
            placeholder="69000"
            value={value.codePostal ?? ""}
            onChange={(e) => onChange({ ...value, codePostal: e.target.value })}
          />
          <small>Aide à préciser la zone si le nom de ville est ambigu.</small>
        </div>
      </div>

      <button className="btn" onClick={onSubmit} disabled={loading || !canSubmit}>
        {loading ? <IconSpinner size={16} /> : <IconSearch size={16} />}
        {loading ? "Recherche en cours..." : "Rechercher sur Google Maps"}
      </button>
    </div>
  );
}
