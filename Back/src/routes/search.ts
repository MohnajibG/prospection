import express from "express";
import { fetchNewEtablissements, fetchEtablissementBySiret } from "../services/sirene";
import { findWebPresence, WebPresenceInput } from "../services/webPresence";

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
