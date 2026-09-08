import { useEffect, useMemo, useState } from "react";
import Filters from "./components/Filters";
import ResultsTable from "./components/ResultsTable";
import SiretSearch from "./components/SiretSearch";
import SiretModal from "./components/SiretModal";
import { fetchNewEtablissements } from "./api/sirene";
import { SearchParams, SireneEtablissement } from "./types";
import { toCSV, downloadCSV } from "./lib/csv";
import { downloadExcel } from "./lib/excel";
import { IconAlert, IconDownload } from "./components/Icons";

const DEFAULTS: SearchParams = {
  nafCodes: ["5610A", "5610C", "5621Z"],
  daysBack: 30,
  postalPrefix: "75",
  nationwide: false,
  perPage: 100,
};

function getDepartementFromCP(cp?: string): string | undefined {
  if (!cp) return undefined;
  const clean = cp.trim();
  if (clean.startsWith("97")) return clean.slice(0, 3);
  return clean.slice(0, 2);
}

export default function App() {
  const [params, setParams] = useState<SearchParams>(() => {
    const saved = localStorage.getItem("sirene_params");

    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
  });

  const [rows, setRows] = useState<SireneEtablissement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [highlightSiret, setHighlightSiret] = useState<string | null>(null);

  const [selectedEtab, setSelectedEtab] = useState<SireneEtablissement | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sirene_params", JSON.stringify(params));
  }, [params]);

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    setDeptFilter("ALL");

    try {
      const data = await fetchNewEtablissements(params);

      const enriched = data.map((e) => ({
        ...e,
        departement: getDepartementFromCP(e.codePostalEtablissement),
      }));

      // tri stable
      enriched.sort((a, b) =>
        (b.dateCreationEtablissement ?? "").localeCompare(
          a.dateCreationEtablissement ?? "",
        ),
      );

      setRows(enriched);
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const handleSiretClick = (_siret: string, row: SireneEtablissement) => {
    setSelectedEtab(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEtab(null);
  };

  const deptOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.departement) set.add(r.departement);
    return Array.from(set).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (deptFilter === "ALL") return rows;
    return rows.filter((r) => r.departement === deptFilter);
  }, [rows, deptFilter]);

  const exportCSV = () => {
    const csv = toCSV(filteredRows);
    const filename = `nouveaux_etablissements_${deptFilter}_${params.daysBack}j.csv`;
    downloadCSV(filename, csv);
  };

  const exportExcel = () => {
    const filename = `nouveaux_etablissements_${deptFilter}_${params.daysBack}j.xlsx`;
    downloadExcel(filename, filteredRows);
  };

  return (
    <div className="container">
      <header className="app-header">
        <div className="app-header__brand">
          <div className="app-header__logo">🧾</div>
          <div>
            <h1>Sirene Prospection</h1>
            <div className="app-header__subtitle">
              Nouveaux établissements — recherche INSEE
            </div>
          </div>
        </div>

        <div className="app-header__badge">
          <span className="app-header__badge-dot" />
          {rows.length
            ? `${rows.length} établissement${rows.length > 1 ? "s" : ""}`
            : "Backend sécurisé"}
        </div>
      </header>

      <Filters
        value={params}
        onChange={setParams}
        onSubmit={runSearch}
        loading={loading}
      />

      <SiretSearch
        onFound={(e) => {
          setRows((prev) => {
            const enriched = {
              ...e,
              departement: getDepartementFromCP(e.codePostalEtablissement),
            };

            const exists = prev.find((x) => x.siret === e.siret);

            if (exists) {
              return prev.map((x) =>
                x.siret === e.siret ? { ...x, ...enriched } : x,
              );
            }

            return [enriched, ...prev];
          });

          setHighlightSiret(e.siret);
          setTimeout(() => setHighlightSiret(null), 3000);
          setDeptFilter("ALL");
        }}
      />

      {error && (
        <div className="card error">
          <IconAlert size={17} />
          {error}
        </div>
      )}

      {!!rows.length && (
        <div className="card row between">
          <div className="segmented" style={{ overflowX: "auto", maxWidth: "100%" }}>
            <button
              type="button"
              className={deptFilter === "ALL" ? "active" : ""}
              onClick={() => setDeptFilter("ALL")}
            >
              Tous ({rows.length})
            </button>
            {deptOptions.map((d) => (
              <button
                type="button"
                key={d}
                className={deptFilter === d ? "active" : ""}
                onClick={() => setDeptFilter(d)}
              >
                {d} ({rows.filter((r) => r.departement === d).length})
              </button>
            ))}
          </div>

          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary" onClick={exportCSV}>
              <IconDownload size={15} />
              CSV
            </button>
            <button className="btn" onClick={exportExcel}>
              <IconDownload size={15} />
              Excel
            </button>
          </div>
        </div>
      )}

      <ResultsTable
        rows={filteredRows}
        highlightSiret={highlightSiret}
        onSiretClick={handleSiretClick}
      />

      {modalOpen && <SiretModal etab={selectedEtab} onClose={closeModal} />}

      <footer className="app-footer">
        INSEE SIRENE API • backend filtré (safe mode)
      </footer>
    </div>
  );
}
