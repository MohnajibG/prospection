import express from "express";
import { fetchNewEtablissements } from "../services/sirene";

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

export default router;
