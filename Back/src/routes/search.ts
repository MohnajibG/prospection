import express from "express";
import { fetchNewEtablissements, fetchEtablissementBySiret } from "../services/sirene";

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

export default router;
