import express from "express";
import cors from "cors";
import pg from "pg";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "..", "dist");
const UPLOADS_DIR = path.join(__dirname, "uploads");

if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "remker1",
  password: process.env.DB_PASSWORD || "Ll0203?!",
  database: process.env.DB_NAME || "remker1_web",
});

// Push notification via Discord webhook
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

async function sendNotification(entry) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: `New message from ${entry.name || "someone"}`,
          color: 0x5865f2,
          fields: [
            { name: "Name", value: entry.name || "N/A", inline: true },
            { name: "Email", value: entry.email || "N/A", inline: true },
            { name: "Message", value: entry.message || "(empty)" },
          ],
          timestamp: new Date().toISOString(),
        }],
      }),
    });
    console.log("Discord notification sent");
  } catch (err) {
    console.error("Failed to send Discord notification:", err.message);
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!ADMIN_PASSWORD || token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ——— Photo upload helper ———
function saveDataUrlToFile(dataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=\s]+)$/.exec(dataUrl);
  if (!match) return dataUrl;
  const contentType = match[1];
  const base64 = match[2].replace(/\s/g, "");
  const extMap = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
    "image/gif": "gif", "image/avif": "avif", "image/svg+xml": "svg",
  };
  const ext = extMap[contentType] || "bin";
  const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);
  writeFileSync(filepath, Buffer.from(base64, "base64"));
  return `/uploads/${filename}`;
}

// ——— Experiences ———
app.get("/api/experiences", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM experiences ORDER BY created_at DESC");
  res.json({ items: rows });
});

app.post("/api/experiences", requireAdmin, async (req, res) => {
  const { title, company, period, description } = req.body;
  const { rows } = await pool.query(
    "INSERT INTO experiences (title, company, period, description) VALUES ($1,$2,$3,$4) RETURNING *",
    [title, company, period, description]
  );
  res.status(201).json(rows[0]);
});

app.delete("/api/experiences/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM experiences WHERE id = $1", [req.params.id]);
  res.status(204).end();
});

app.put("/api/experiences", requireAdmin, async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  await pool.query("DELETE FROM experiences");
  for (const item of items) {
    await pool.query(
      "INSERT INTO experiences (title, company, period, description) VALUES ($1,$2,$3,$4)",
      [item.title, item.company, item.period, item.description]
    );
  }
  const { rows } = await pool.query("SELECT * FROM experiences ORDER BY created_at DESC");
  res.json({ items: rows });
});

// ——— Projects ———
app.get("/api/projects", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM projects ORDER BY id ASC");
  res.json({ items: rows });
});

app.post("/api/projects", requireAdmin, async (req, res) => {
  let { title, description, tags, github, live } = req.body;
  if (typeof tags === "string") tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
  const { rows } = await pool.query(
    "INSERT INTO projects (title, description, tags, github, live) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [title, description, tags || [], github, live]
  );
  res.status(201).json(rows[0]);
});

app.delete("/api/projects/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM projects WHERE id = $1", [req.params.id]);
  res.status(204).end();
});

app.put("/api/projects", requireAdmin, async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  await pool.query("DELETE FROM projects");
  for (const item of items) {
    let tags = item.tags;
    if (typeof tags === "string") tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    await pool.query(
      "INSERT INTO projects (title, description, tags, github, live) VALUES ($1,$2,$3,$4,$5)",
      [item.title, item.description, tags || [], item.github, item.live]
    );
  }
  const { rows } = await pool.query("SELECT * FROM projects ORDER BY id ASC");
  res.json({ items: rows });
});

// ——— Photos ———
app.get("/api/photos", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM photos ORDER BY id ASC");
  res.json({ items: rows });
});

app.post("/api/photos", requireAdmin, async (req, res) => {
  let { url, alt } = req.body;
  if (url && url.startsWith("data:image/")) url = saveDataUrlToFile(url);
  const { rows } = await pool.query(
    "INSERT INTO photos (url, alt) VALUES ($1,$2) RETURNING *",
    [url, alt || ""]
  );
  res.status(201).json(rows[0]);
});

app.delete("/api/photos/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM photos WHERE id = $1", [req.params.id]);
  res.status(204).end();
});

app.put("/api/photos", requireAdmin, async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  await pool.query("DELETE FROM photos");
  for (const item of items) {
    let url = item.url;
    if (url && url.startsWith("data:image/")) url = saveDataUrlToFile(url);
    await pool.query(
      "INSERT INTO photos (url, alt) VALUES ($1,$2)",
      [url, item.alt || ""]
    );
  }
  const { rows } = await pool.query("SELECT * FROM photos ORDER BY id ASC");
  res.json({ items: rows });
});

// ——— Messages ———
app.get("/api/messages", requireAdmin, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM messages ORDER BY created_at DESC");
  res.json({ items: rows });
});

app.post("/api/messages", async (req, res) => {
  const { name, email, message } = req.body;
  const { rows } = await pool.query(
    "INSERT INTO messages (name, email, message) VALUES ($1,$2,$3) RETURNING *",
    [name || "", email || "", message || ""]
  );
  // Send email notification (don't block the response)
  sendNotification(rows[0]);
  res.status(201).json(rows[0]);
});

app.delete("/api/messages/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM messages WHERE id = $1", [req.params.id]);
  res.status(204).end();
});

app.put("/api/messages", requireAdmin, async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  await pool.query("DELETE FROM messages");
  for (const item of items) {
    await pool.query(
      "INSERT INTO messages (name, email, message) VALUES ($1,$2,$3)",
      [item.name, item.email, item.message]
    );
  }
  const { rows } = await pool.query("SELECT * FROM messages ORDER BY created_at DESC");
  res.json({ items: rows });
});

// ——— Admin endpoint (legacy compatibility) ———
app.post("/api/admin", async (req, res) => {
  const { password, action, payload } = req.body || {};
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    switch (action) {
      case "ping":
        return res.json({ ok: true });
      case "getMessages": {
        const { rows } = await pool.query("SELECT * FROM messages ORDER BY created_at DESC");
        return res.json({ items: rows });
      }
      case "addExperience": {
        const { rows } = await pool.query(
          "INSERT INTO experiences (title, company, period, description) VALUES ($1,$2,$3,$4) RETURNING *",
          [payload.title, payload.company, payload.period, payload.description]
        );
        return res.status(201).json(rows[0]);
      }
      case "deleteExperience":
        await pool.query("DELETE FROM experiences WHERE id = $1", [payload.id]);
        return res.status(204).end();
      case "setExperiences": {
        await pool.query("DELETE FROM experiences");
        for (const item of (payload.items || [])) {
          await pool.query(
            "INSERT INTO experiences (title, company, period, description) VALUES ($1,$2,$3,$4)",
            [item.title, item.company, item.period, item.description]
          );
        }
        return res.json({ items: payload.items || [] });
      }
      case "addProject": {
        let tags = payload.tags;
        if (typeof tags === "string") tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
        const { rows } = await pool.query(
          "INSERT INTO projects (title, description, tags, github, live) VALUES ($1,$2,$3,$4,$5) RETURNING *",
          [payload.title, payload.description, tags || [], payload.github, payload.live]
        );
        return res.status(201).json(rows[0]);
      }
      case "deleteProject":
        await pool.query("DELETE FROM projects WHERE id = $1", [payload.id]);
        return res.status(204).end();
      case "setProjects": {
        await pool.query("DELETE FROM projects");
        for (const item of (payload.items || [])) {
          let tags = item.tags;
          if (typeof tags === "string") tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
          await pool.query(
            "INSERT INTO projects (title, description, tags, github, live) VALUES ($1,$2,$3,$4,$5)",
            [item.title, item.description, tags || [], item.github, item.live]
          );
        }
        return res.json({ items: payload.items || [] });
      }
      case "addPhoto": {
        let url = payload.url;
        if (url && url.startsWith("data:image/")) url = saveDataUrlToFile(url);
        const { rows } = await pool.query(
          "INSERT INTO photos (url, alt) VALUES ($1,$2) RETURNING *",
          [url, payload.alt || ""]
        );
        return res.status(201).json(rows[0]);
      }
      case "deletePhoto":
        await pool.query("DELETE FROM photos WHERE id = $1", [payload.id]);
        return res.status(204).end();
      case "setPhotos": {
        await pool.query("DELETE FROM photos");
        for (const item of (payload.items || [])) {
          let url = item.url;
          if (url && url.startsWith("data:image/")) url = saveDataUrlToFile(url);
          await pool.query("INSERT INTO photos (url, alt) VALUES ($1,$2)", [url, item.alt || ""]);
        }
        return res.json({ items: payload.items || [] });
      }
      case "deleteMessage":
        await pool.query("DELETE FROM messages WHERE id = $1", [payload.id]);
        return res.status(204).end();
      case "setMessages": {
        await pool.query("DELETE FROM messages");
        for (const item of (payload.items || [])) {
          await pool.query(
            "INSERT INTO messages (name, email, message) VALUES ($1,$2,$3)",
            [item.name, item.email, item.message]
          );
        }
        return res.json({ items: payload.items || [] });
      }
      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (err) {
    console.error("Admin API error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

// ——— Static site ———
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  if (existsSync(DIST_DIR)) {
    console.log("Serving static site from dist/");
  } else {
    console.log("No dist/ folder found. Run 'npm run build' then restart to serve the site.");
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is in use. Free it with: lsof -ti:${PORT} | xargs kill`);
    process.exit(1);
  }
  throw err;
});
