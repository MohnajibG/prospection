import { useEffect, useMemo, useState } from "react";
import Filters from "./components/Filters";
import ResultsTable from "./components/ResultsTable";
import SiretSearch from "./components/SiretSearch";
import SiretModal from "./components/SiretModal";
import MessageModal from "./components/MessageModal";
import SenderSettings from "./components/SenderSettings";
import StatCards from "./components/StatCards";
import { fetchNewEtablissements, enrichWebPresence } from "./api/sirene";
import { PresenceFilter, SearchParams, SireneEtablissement } from "./types";
import { toCSV, downloadCSV, downloadText } from "./lib/csv";
import { downloadExcel } from "./lib/excel";
import { buildOutreachMessage, toOutreachText } from "./lib/messageTemplate";
import { getSenderProfile, saveSenderProfile, SenderProfile } from "./lib/senderProfile";
import { getContactedSet, setContacted } from "./lib/contactStatus";
import { getLeadEmails, setLeadEmail } from "./lib/leadEmails";
import {
  IconAlert,
  IconChevronDown,
  IconDownload,
  IconMail,
  IconSettings,
  IconSpinner,
  IconTarget,
} from "./components/Icons";

const DEFAULTS: SearchParams = {
  nafCodes: ["5610A", "5610C", "5621Z"],
  daysBack: 30,
  postalPrefix: "75",
  nationwide: false,
  perPage: 100,
};

function getDepartementFromCP(cp?: string): string | undefined {
  if (!cp || !/^\d{5}$/.test(cp.trim())) return undefined;
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
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [presenceFilter, setPresenceFilter] = useState<PresenceFilter>("ALL");
  const [hideContacted, setHideContacted] = useState(false);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [highlightSiret, setHighlightSiret] = useState<string | null>(null);
  const [siretSearchOpen, setSiretSearchOpen] = useState(false);

  const [contacted, setContactedState] = useState<Set<string>>(() => getContactedSet());
  const [leadEmails, setLeadEmailsState] = useState<Record<string, string>>(() =>
    getLeadEmails(),
  );

  const [selectedEtab, setSelectedEtab] = useState<SireneEtablissement | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  const [senderProfile, setSenderProfile] = useState<SenderProfile>(() =>
    getSenderProfile(),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messageEtab, setMessageEtab] = useState<SireneEtablissement | null>(
    null,
  );

  useEffect(() => {
    localStorage.setItem("sirene_params", JSON.stringify(params));
  }, [params]);

  const enrichRows = async (targetRows: SireneEtablissement[]) => {
    if (!targetRows.length) return;

    setEnriching(true);
    setError(null);

    try {
      const targets = targetRows.map((r) => ({
        siret: r.siret,
        nom: r.denominationUniteLegale || r.nomUniteLegale,
        adresse: r.adresse,
        codePostal: r.codePostalEtablissement,
        commune: r.libelleCommuneEtablissement,
      }));

      const result = await enrichWebPresence(targets);

      setRows((prev) =>
        prev.map((r) => {
          const hit = result[r.siret];
          if (!hit) return r;

          return {
            ...r,
            telephone: hit.phone,
            siteWeb: hit.website,
            presenceWeb: !hit.matched
              ? "inconnu"
              : hit.hasWebsite
                ? "avec_site"
                : "sans_site",
          };
        }),
      );
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de la vérification");
    } finally {
      setEnriching(false);
    }
  };

  const runEnrich = () => enrichRows(filteredRows);

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    setWarning(null);
    setDeptFilter("ALL");
    setPresenceFilter("ALL");

    try {
      const { rows: data, warning: w } = await fetchNewEtablissements(params);

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
      if (w) setWarning(w);
      setLoading(false);

      // Le résultat de recherche arrive déjà enrichi via Google Places,
      // sans étape manuelle supplémentaire.
      await enrichRows(enriched);
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
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

  const handleMessageClick = (row: SireneEtablissement) => {
    setMessageEtab(row);
  };

  const handleSaveSenderProfile = (profile: SenderProfile) => {
    setSenderProfile(profile);
    saveSenderProfile(profile);
  };

  const handleToggleContacted = (siret: string) => {
    setContactedState((prev) => setContacted(prev, siret, !prev.has(siret)));
  };

  const handleLeadEmailChange = (siret: string, email: string) => {
    setLeadEmailsState((prev) => setLeadEmail(prev, siret, email));
  };

  const deptOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.departement) set.add(r.departement);
    return Array.from(set).sort();
  }, [rows]);

  const deptFilteredRows = useMemo(
    () => (deptFilter === "ALL" ? rows : rows.filter((r) => r.departement === deptFilter)),
    [rows, deptFilter],
  );

  const stats = useMemo(
    () => ({
      total: deptFilteredRows.length,
      sansSite: deptFilteredRows.filter((r) => r.presenceWeb === "sans_site").length,
      avecSite: deptFilteredRows.filter((r) => r.presenceWeb === "avec_site").length,
      inconnu: deptFilteredRows.filter((r) => !r.presenceWeb || r.presenceWeb === "inconnu")
        .length,
    }),
    [deptFilteredRows],
  );

  const filteredRows = useMemo(() => {
    let list = deptFilteredRows;

    if (presenceFilter !== "ALL") {
      list =
        presenceFilter === "inconnu"
          ? list.filter((r) => !r.presenceWeb || r.presenceWeb === "inconnu")
          : list.filter((r) => r.presenceWeb === presenceFilter);
    }

    if (hideContacted) list = list.filter((r) => !contacted.has(r.siret));

    return [...list].sort((a, b) => {
      const cmp = (a.dateCreationEtablissement ?? "").localeCompare(
        b.dateCreationEtablissement ?? "",
      );
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [deptFilteredRows, presenceFilter, hideContacted, contacted, sortDir]);

  const noSiteCount = stats.sansSite;

  const exportCSV = () => {
    const csv = toCSV(filteredRows);
    const filename = `nouveaux_etablissements_${deptFilter}_${params.daysBack}j.csv`;
    downloadCSV(filename, csv);
  };

  const exportExcel = () => {
    const filename = `nouveaux_etablissements_${deptFilter}_${params.daysBack}j.xlsx`;
    downloadExcel(filename, filteredRows);
  };

  const exportMessages = () => {
    const leads = filteredRows.filter((r) => r.presenceWeb === "sans_site");
    const entries = leads.map((row) => ({
      row,
      ...buildOutreachMessage(row, senderProfile),
    }));
    const text = toOutreachText(entries);
    const filename = `messages_prospection_${deptFilter}_${params.daysBack}j.txt`;
    downloadText(filename, text);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <div className="topbar__logo">🧾</div>
          <div>
            <h1>LeadRadar</h1>
            <div className="topbar__subtitle">Nouveaux établissements — recherche INSEE + Google Places</div>
          </div>
        </div>

        <div className="row" style={{ gap: 10 }}>
          <div className="topbar__badge">
            <span className="topbar__badge-dot" />
            Backend sécurisé
          </div>

          <button
            type="button"
            className="icon-btn"
            title="Mes coordonnées (signature des messages)"
            onClick={() => setSettingsOpen(true)}
          >
            <IconSettings size={18} />
          </button>
        </div>
      </header>

      <div className="shell">
        <aside className="sidebar">
          <div className="step-label">Rechercher</div>

          <Filters value={params} onChange={setParams} onSubmit={runSearch} loading={loading} />

          <button
            type="button"
            className="disclosure"
            onClick={() => setSiretSearchOpen((v) => !v)}
            aria-expanded={siretSearchOpen}
          >
            <IconChevronDown
              size={14}
              className={siretSearchOpen ? "disclosure__chevron open" : "disclosure__chevron"}
            />
            Ajouter un établissement précis par SIRET
          </button>

          {siretSearchOpen && (
            <SiretSearch
              onFound={(e) => {
                const enriched = {
                  ...e,
                  departement: getDepartementFromCP(e.codePostalEtablissement),
                };

                setRows((prev) => {
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

                void enrichRows([enriched]);
              }}
            />
          )}
        </aside>

        <main className="main">
          {error && (
            <div className="card error">
              <IconAlert size={17} />
              {error}
            </div>
          )}

          {warning && (
            <div className="card warning">
              <IconAlert size={17} />
              {warning}
            </div>
          )}

          {!rows.length ? (
            <ResultsTable
              rows={filteredRows}
              highlightSiret={highlightSiret}
              contacted={contacted}
              sortDir={sortDir}
              onToggleSort={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              onToggleContacted={handleToggleContacted}
              onSiretClick={handleSiretClick}
              onMessageClick={handleMessageClick}
            />
          ) : (
            <>
              <div className="step-label">Qualifier &amp; prospecter</div>

              <StatCards
                total={stats.total}
                sansSite={stats.sansSite}
                avecSite={stats.avecSite}
                inconnu={stats.inconnu}
                active={presenceFilter}
                onSelect={setPresenceFilter}
              />

              <div className="card toolbar">
                {deptOptions.length > 1 ? (
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
                ) : (
                  <span className="muted" style={{ fontSize: 13 }}>
                    {filteredRows.length} établissement{filteredRows.length > 1 ? "s" : ""} affiché
                    {filteredRows.length > 1 ? "s" : ""}
                  </span>
                )}

                <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={`chip ${hideContacted ? "active" : ""}`}
                    onClick={() => setHideContacted((v) => !v)}
                    aria-pressed={hideContacted}
                  >
                    Masquer les contactés
                  </button>

                  <button className="btn secondary" onClick={runEnrich} disabled={enriching}>
                    {enriching ? <IconSpinner size={15} /> : <IconTarget size={15} />}
                    {enriching ? "Vérification..." : "Revérifier la présence web"}
                  </button>

                  {noSiteCount > 0 && (
                    <button className="btn secondary" onClick={exportMessages}>
                      <IconMail size={15} />
                      Exporter messages ({filteredRows.filter((r) => r.presenceWeb === "sans_site").length})
                    </button>
                  )}

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

              <ResultsTable
                rows={filteredRows}
                highlightSiret={highlightSiret}
                contacted={contacted}
                sortDir={sortDir}
                onToggleSort={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                onToggleContacted={handleToggleContacted}
                onSiretClick={handleSiretClick}
                onMessageClick={handleMessageClick}
              />
            </>
          )}
        </main>
      </div>

      {modalOpen && (
        <SiretModal
          etab={selectedEtab}
          onClose={closeModal}
          onMessageClick={(row) => {
            closeModal();
            handleMessageClick(row);
          }}
        />
      )}

      <MessageModal
        etab={messageEtab}
        profile={senderProfile}
        email={(messageEtab && leadEmails[messageEtab.siret]) || ""}
        isContacted={!!messageEtab && contacted.has(messageEtab.siret)}
        onEmailChange={handleLeadEmailChange}
        onToggleContacted={handleToggleContacted}
        onClose={() => setMessageEtab(null)}
      />

      <SenderSettings
        open={settingsOpen}
        profile={senderProfile}
        onSave={handleSaveSenderProfile}
        onClose={() => setSettingsOpen(false)}
      />

      <footer className="app-footer">INSEE SIRENE API • backend filtré (safe mode)</footer>
    </div>
  );
}
