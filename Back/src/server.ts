import fs from "fs";
import path from "path";
import app from "./app";

const PREFERRED_PORT = Number(process.env.PORT) || 3001;
const MAX_ATTEMPTS = 50;

// Le Front lit ce fichier au démarrage pour savoir sur quel port le
// backend a fini par écouter (voir Front/vite.config.ts).
const PORT_FILE = path.join(__dirname, "..", ".port");

function listen(port: number, attemptsLeft: number) {
  const server = app.listen(port, () => {
    fs.writeFileSync(PORT_FILE, String(port), "utf-8");
    console.log(`API running on http://localhost:${port}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE" && attemptsLeft > 0) {
      console.log(`Port ${port} déjà utilisé, essai sur ${port + 1}...`);
      listen(port + 1, attemptsLeft - 1);
      return;
    }

    throw err;
  });
}

listen(PREFERRED_PORT, MAX_ATTEMPTS);
