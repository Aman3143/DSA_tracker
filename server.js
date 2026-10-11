const express = require("express");
const path = require("path");
const fs = require("fs/promises");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "progress.json");
const PUBLIC_DIR = path.join(__dirname, "public");

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON request body." });
  }
  next(err);
});
app.use(express.static(PUBLIC_DIR));

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ state: {} }, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStore();
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  } catch (err) {
    console.error("Could not read progress store:", err.message);
    throw new Error("Progress store is unreadable. Restore data/progress.json from a backup.");
  }
}

async function writeStore(data) {
  await ensureStore();
  const tempFile = DATA_FILE + ".tmp";
  await fs.writeFile(tempFile, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tempFile, DATA_FILE);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "dsa-placement-tracker", timestamp: new Date().toISOString() });
});

app.get("/api/state", async (_req, res) => {
  try {
    const store = await readStore();
    res.set("Cache-Control", "no-store");
    res.json({ state: store.state || {} });
  } catch (err) {
    res.status(500).json({ error: "Unable to load progress", detail: err.message });
  }
});

app.put("/api/state", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "Request body must be a JSON object." });
  }
  // Limit accepted top-level fields to the tracker's supported state structure.
  const allowed = ["completed", "notes", "hours", "habits", "theme", "selectedWeek"];
  const state = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) state[key] = req.body[key];
  }
  try {
    await writeStore({ state, updatedAt: new Date().toISOString() });
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Unable to save progress", detail: err.message });
  }
});

app.get("/api/export", async (_req, res) => {
  try {
    const store = await readStore();
    res.set("Content-Disposition", 'attachment; filename="dsa-progress-backup.json"');
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: "Unable to export progress", detail: err.message });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`DSA Placement Tracker running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
