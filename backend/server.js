import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DIST_DIR = path.join(__dirname, "..", "dist");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

function readJson(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!existsSync(filepath)) return [];
  try {
    const raw = readFileSync(filepath, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeJson(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!ADMIN_PASSWORD || token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ——— Experiences ———
app.get("/api/experiences", (req, res) => {
  res.json({ items: readJson("experiences.json") });
});

app.post("/api/experiences", requireAdmin, (req, res) => {
  const items = readJson("experiences.json");
  const newItem = { ...req.body, id: req.body.id || Date.now() };
  items.push(newItem);
  writeJson("experiences.json", items);
  res.status(201).json(newItem);
});

app.delete("/api/experiences/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const items = readJson("experiences.json").filter((x) => x.id !== id);
  writeJson("experiences.json", items);
  res.status(204).end();
});

app.put("/api/experiences", requireAdmin, (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  writeJson("experiences.json", items);
  res.json({ items });
});

// ——— Projects ———
app.get("/api/projects", (req, res) => {
  res.json({ items: readJson("projects.json") });
});

app.post("/api/projects", requireAdmin, (req, res) => {
  const items = readJson("projects.json");
  const newItem = { ...req.body, id: req.body.id || Date.now() };
  if (typeof newItem.tags === "string") {
    newItem.tags = newItem.tags.split(",").map((t) => t.trim()).filter(Boolean);
  }
  items.push(newItem);
  writeJson("projects.json", items);
  res.status(201).json(newItem);
});

app.delete("/api/projects/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const items = readJson("projects.json").filter((x) => x.id !== id);
  writeJson("projects.json", items);
  res.status(204).end();
});

app.put("/api/projects", requireAdmin, (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  writeJson("projects.json", items);
  res.json({ items });
});

// ——— Photos ———
app.get("/api/photos", (req, res) => {
  res.json({ items: readJson("photos.json") });
});

app.post("/api/photos", requireAdmin, (req, res) => {
  const items = readJson("photos.json");
  const newItem = { ...req.body, id: req.body.id || Date.now() };
  items.push(newItem);
  writeJson("photos.json", items);
  res.status(201).json(newItem);
});

app.delete("/api/photos/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const items = readJson("photos.json").filter((x) => x.id !== id);
  writeJson("photos.json", items);
  res.status(204).end();
});

app.put("/api/photos", requireAdmin, (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  writeJson("photos.json", items);
  res.json({ items });
});

// ——— Messages (contact form) ———
app.get("/api/messages", requireAdmin, (req, res) => {
  res.json({ items: readJson("messages.json") });
});

app.post("/api/messages", (req, res) => {
  const items = readJson("messages.json");
  const newItem = {
    id: req.body.id || Date.now(),
    createdAt: req.body.createdAt || new Date().toISOString(),
    name: req.body.name || "",
    email: req.body.email || "",
    message: req.body.message || "",
  };
  items.unshift(newItem);
  writeJson("messages.json", items);
  res.status(201).json(newItem);
});

app.delete("/api/messages/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const items = readJson("messages.json").filter((x) => x.id !== id);
  writeJson("messages.json", items);
  res.status(204).end();
});

app.put("/api/messages", requireAdmin, (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  writeJson("messages.json", items);
  res.json({ items });
});

// ——— Static site ———
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      if (existsSync(DIST_DIR)) {
        console.log("Serving static site from dist/");
      } else {
        console.log("No dist/ folder found. Run 'npm run build' then restart to serve the site.");
      }
      resolve(server);
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") reject(err);
      else reject(err);
    });
  });
}

(async () => {
  const maxTries = 10;
  for (let i = 0; i < maxTries; i++) {
    const port = PORT + i;
    try {
      await startServer(port);
      return;
    } catch (err) {
      if (err.code === "EADDRINUSE" && i < maxTries - 1) {
        console.warn(`Port ${port} in use, trying ${port + 1}...`);
      } else {
        console.error(`Port ${port} is in use. Free it with: lsof -ti:${port} | xargs kill`);
        process.exit(1);
      }
    }
  }
})();
