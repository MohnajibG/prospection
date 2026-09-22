import express from "express";
import { fetchNewEtablissements, fetchEtablissementBySiret } from "../services/sirene";
import { findWebPresence, WebPresenceInput } from "../services/webPresence";
import { searchAreaGooglePlaces } from "../services/googlePlaces";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const data = await fetchNewEtablissements(req.body);

    return res.json(data);
  } catch (err: any) {
    console.error("SEARCH ROUTE ERROR:", err);

    return res.status(200).json({
      error: err.message || "Unknown error",
      data: [],
    });
  }
});

router.get("/siret/:siret", async (req, res) => {
  try {
    const etab = await fetchEtablissementBySiret(req.params.siret);

    if (!etab) {
      return res.status(404).json({ error: "Aucun établissement trouvé." });
    }

    return res.json(etab);
  } catch (err: any) {
    console.error("SIRET ROUTE ERROR:", err);

    return res.status(400).json({ error: err.message || "Unknown error" });
  }
});

router.post("/area", async (req, res) => {
  try {
    const secteur = String(req.body?.secteur ?? "").trim();
    const ville = String(req.body?.ville ?? "").trim();
    const codePostal = req.body?.codePostal ? String(req.body.codePostal).trim() : undefined;

    if (!secteur || !ville) {
      return res.status(400).json({ error: "Secteur et ville sont requis." });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "GOOGLE_PLACES_API_KEY manquante côté serveur — configure-la dans Back/.env.",
      });
    }

    const places = await searchAreaGooglePlaces({ secteur, ville, codePostal }, apiKey);

    const data = places.map((p) => ({
      siret: p.placeId,
      source: "maps" as const,
      activiteLibelle: secteur,
      denominationUniteLegale: p.nom,
      adresse: p.adresse,
      codePostalEtablissement: p.codePostal,
      libelleCommuneEtablissement: p.commune,
      telephone: p.telephone,
      siteWeb: p.siteWeb,
      presenceWeb: p.hasWebsite ? "avec_site" : "sans_site",
      rating: p.rating,
      ratingCount: p.ratingCount,
    }));

    return res.json({ data });
  } catch (err: any) {
    console.error("AREA SEARCH ROUTE ERROR:", err);

    return res.status(200).json({
      error: err.message || "Unknown error",
      data: [],
    });
  }
});

router.post("/enrich", async (req, res) => {
  try {
    const rows: WebPresenceInput[] = Array.isArray(req.body?.rows)
      ? req.body.rows
      : [];

    const map = await findWebPresence(rows);

    return res.json(Object.fromEntries(map));
  } catch (err: any) {
    console.error("ENRICH ROUTE ERROR:", err);

    return res.status(500).json({ error: err.message || "Unknown error" });
  }
});

export default router;
