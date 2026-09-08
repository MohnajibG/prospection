import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import searchRoute from "./routes/search";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/search", searchRoute);

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("GLOBAL ERROR:", err);

  res.status(500).json({
    error: "Internal server error",
  });
});

export default app;
