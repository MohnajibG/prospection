import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import searchRoute from "./routes/search";
import e from "express";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/search", searchRoute);

// 🔥 GLOBAL ERROR HANDLER (CRITIQUE)
app.use((err: any, req: any, res: any, next: any) => {
  console.error("GLOBAL ERROR:", err);

  res.status(500).json({
    error: "Internal server error",
  });
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
export default app;
