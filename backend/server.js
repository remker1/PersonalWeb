import express from "express";
import cors from "cors";
import pg from "pg";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { statfs, readFile } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "..", "dist");
const UPLOADS_DIR = path.join(__dirname, "uploads");

if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const PORT = process.env.PORT || 3000;
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || "http://libretranslate:5000";

// PostgreSQL — prefer DATABASE_URL (typical in Docker Compose); else DB_* / libpq-style PG* vars.
function createPgPool() {
  const url = process.env.DATABASE_URL;
  if (url) {
    return new pg.Pool({ connectionString: url });
  }
  const host = process.env.DB_HOST || process.env.PGHOST || "localhost";
  if (host === "172.17.0.1") {
    console.warn(
      "DB_HOST=172.17.0.1 is usually wrong from a container — use your Postgres service name (e.g. postgres) or set DATABASE_URL.",
    );
  }
  return new pg.Pool({
    host,
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || "5432", 10),
    user: process.env.DB_USER || process.env.PGUSER || "remker1",
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || "Ll0203?!",
    database: process.env.DB_NAME || process.env.PGDATABASE || "remker1_web",
  });
}

const pool = createPgPool();

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

// ——— System stats ———
const HOST_PROC = "/host/proc";
const HOST_ROOT = "/host/rootfs";

const execFileAsync = promisify(execFile);

/** Pseudo / virtual fs types we skip for the “real disks” list (still noisy on some hosts). */
const SKIP_FSTYPES = new Set([
  "proc", "sysfs", "devtmpfs", "devpts", "tmpfs", "cgroup", "cgroup2",
  "pstore", "bpf", "tracefs", "fusectl", "securityfs", "debugfs", "mqueue",
  "configfs", "rpc_pipefs", "binfmt_misc", "autofs", "overlay",
  "hugetlbfs", "squashfs",
]);

/** Docker / cloud-init file bind mounts — not real disk roots (same block dev as /). */
const JUNK_MOUNTPOINTS = new Set([
  "/etc/hostname", "/etc/hosts", "/etc/resolv.conf", "/etc/machine-id",
  "/etc/timezone", "/etc/nsswitch.conf",
]);

function isJunkMountpoint(target) {
  if (!target) return true;
  if (JUNK_MOUNTPOINTS.has(target)) return true;
  return false;
}

function splitProcMountsLine(line) {
  let i = 0;
  while (i < line.length && !/\s/.test(line[i])) i += 1;
  const source = line.slice(0, i);
  while (i < line.length && /\s/.test(line[i])) i += 1;
  let target = "";
  while (i < line.length) {
    if (line.slice(i, i + 4) === "\\040") {
      target += " ";
      i += 4;
    } else if (/\s/.test(line[i])) {
      break;
    } else {
      target += line[i];
      i += 1;
    }
  }
  while (i < line.length && /\s/.test(line[i])) i += 1;
  let fstype = "";
  while (i < line.length && !/\s/.test(line[i])) {
    fstype += line[i];
    i += 1;
  }
  if (!source || !target || !fstype) return null;
  return { source, target, fstype };
}

function parseProcMounts(content) {
  const rows = [];
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    const row = splitProcMountsLine(line);
    if (row) rows.push(row);
  }
  return rows;
}

/** Map a /dev node to a physical disk id so we only show one line per drive. */
function blockDeviceGroup(source) {
  if (!source) return "unknown";
  if (source.startsWith("/dev/mapper/") || source.startsWith("/dev/md")) return source;
  const sd = /^\/dev\/(sd[a-z]+)\d+$/.exec(source);
  if (sd) return `disk:${sd[1]}`;
  const nv = /^\/dev\/(nvme\d+n\d+)p\d+$/.exec(source);
  if (nv) return `disk:${nv[1]}`;
  const mmc = /^\/dev\/(mmcblk\d+)p\d+$/.exec(source);
  if (mmc) return `disk:${mmc[1]}`;
  const vd = /^\/dev\/(vd[a-z]+)\d+$/.exec(source);
  if (vd) return `disk:${vd[1]}`;
  return source;
}

function mountPickScore(v) {
  if (v.error) return -1e9;
  const mp = v.mountpoint || "";
  if (mp === "/") return 1e6;
  if (mp === "/home" || mp === "/var") return 1e5;
  if (mp.startsWith("/mnt") || mp.startsWith("/media")) return 1e4;
  if (mp.startsWith("/etc/") || mp.startsWith("/run/")) return -1e6;
  return (v.total ?? 0) / 1e12;
}

function pickRepresentativeVolume(a, b) {
  const sa = mountPickScore(a);
  const sb = mountPickScore(b);
  if (sa !== sb) return sa > sb ? a : b;
  if (a.error && !b.error) return b;
  if (!a.error && b.error) return a;
  const at = a.total ?? 0;
  const bt = b.total ?? 0;
  return at >= bt ? a : b;
}

const DEFAULT_MAX_DRIVES = 2;

function resolveHostStatPath(hostMounted, target) {
  if (!hostMounted) return target;
  const norm = String(target).replace(/\/+/g, "/");
  if (norm.startsWith(HOST_ROOT)) return norm;
  if (norm === "/") return HOST_ROOT;
  return path.join(HOST_ROOT, norm.replace(/^\//, ""));
}

async function statOneMount(hostMounted, source, target, fstype) {
  const statPath = resolveHostStatPath(hostMounted, target);
  try {
    const s = await statfs(statPath);
    const total = Number(s.blocks) * Number(s.bsize);
    const free = Number(s.bavail) * Number(s.bsize);
    return {
      source,
      mountpoint: target,
      fstype,
      total,
      free,
      used: Math.max(0, total - free),
    };
  } catch (err) {
    return {
      source,
      mountpoint: target,
      fstype,
      error: err.message,
    };
  }
}

/**
 * Optional: DISK_MOUNTS=/,/mnt/data — comma-separated mountpoints (only these are shown).
 * Otherwise: one row per physical disk (max DISK_MAX_DRIVES, default 2), best partition per disk.
 */
async function gatherDiskVolumes(hostMounted) {
  const maxDrives = Math.min(
    32,
    Math.max(1, parseInt(process.env.DISK_MAX_DRIVES || String(DEFAULT_MAX_DRIVES), 10) || DEFAULT_MAX_DRIVES),
  );
  const explicit = (process.env.DISK_MOUNTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const mountsPath = hostMounted ? `${HOST_PROC}/mounts` : "/proc/mounts";
  const raw = await readText(mountsPath);

  if (explicit.length > 0) {
    const byTarget = new Map();
    if (raw) {
      for (const row of parseProcMounts(raw)) byTarget.set(row.target, row);
    }
    const volumes = [];
    for (const mp of explicit.slice(0, maxDrives)) {
      const row = byTarget.get(mp);
      volumes.push(
        await statOneMount(hostMounted, row?.source ?? "—", mp, row?.fstype ?? "—"),
      );
    }
    return { volumes, mode: "explicit" };
  }

  if (!raw) return { volumes: [], error: "Could not read mounts" };

  const seen = new Map();
  for (const row of parseProcMounts(raw)) {
    if (SKIP_FSTYPES.has(row.fstype)) continue;
    if (row.target.startsWith("/proc") || row.target.startsWith("/sys")) continue;
    if (isJunkMountpoint(row.target)) continue;
    seen.set(row.target, row);
  }

  const rawVolumes = [];

  if (hostMounted) {
    const rootLine = parseProcMounts(raw).find((r) => r.target === "/");
    if (rootLine) {
      rawVolumes.push(
        await statOneMount(hostMounted, rootLine.source, "/", rootLine.fstype),
      );
    }
  }

  for (const { source, target, fstype } of seen.values()) {
    if (hostMounted && target === "/") continue;
    rawVolumes.push(await statOneMount(hostMounted, source, target, fstype));
  }

  const byDisk = new Map();
  for (const v of rawVolumes) {
    const g = blockDeviceGroup(v.source);
    const prev = byDisk.get(g);
    if (!prev) byDisk.set(g, v);
    else byDisk.set(g, pickRepresentativeVolume(prev, v));
  }

  const volumes = [...byDisk.values()]
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
    .slice(0, maxDrives);

  volumes.sort((a, b) => a.mountpoint.localeCompare(b.mountpoint));

  return { volumes, mode: "auto" };
}

async function runHostCommand(cmd, args, opts = {}) {
  const { timeout = 12_000, maxBuffer = 8 * 1024 * 1024 } = opts;
  try {
    const { stdout } = await execFileAsync(cmd, args, { timeout, maxBuffer });
    return { ok: true, stdout: String(stdout || "") };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

function resolveDockerBinary() {
  if (process.env.DOCKER_BIN) return process.env.DOCKER_BIN;
  const candidates = [
    "/usr/bin/docker",
    "/usr/local/bin/docker",
    path.join(HOST_ROOT, "usr/bin/docker"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return "docker";
}

async function runSystemctl(args) {
  const hostCtl = path.join(HOST_ROOT, "usr/bin/systemctl");
  if (existsSync(hostCtl)) {
    return runHostCommand("chroot", [HOST_ROOT, "systemctl", ...args]);
  }
  return runHostCommand("systemctl", args);
}

/** Comma-separated env override, e.g. SYSTEMD_SERVICE_FILTER=docker,tailscale,nextcloud */
const DEFAULT_SYSTEMD_KEYWORDS = ["docker", "tailscale", "nextcloud", "rustdesk", "cloudflare"];

function getSystemdInterestKeywords() {
  const raw = process.env.SYSTEMD_SERVICE_FILTER || process.env.SYSTEMD_SERVICE_KEYWORDS;
  if (raw && raw.trim()) {
    return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  }
  return DEFAULT_SYSTEMD_KEYWORDS;
}

function matchesSystemdInterest(name, keyword) {
  const n = (name || "").toLowerCase();
  const k = keyword.toLowerCase();
  if (k === "cloudflare") return n.includes("cloudflared") || n.includes("cloudflare");
  return n.includes(k);
}

function filterSystemdInterest(units) {
  const keys = getSystemdInterestKeywords();
  if (!keys.length) return units;
  return units.filter((u) => keys.some((k) => matchesSystemdInterest(u.name, k)));
}

async function gatherDockerStatus() {
  const bin = resolveDockerBinary();
  const r = await runHostCommand(bin, ["ps", "-a", "--no-trunc", "--format", "{{json .}}"]);
  if (!r.ok) return { available: false, error: r.error, containers: [] };

  const containers = [];
  for (const line of r.stdout.trim().split("\n")) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      containers.push({
        id: o.ID || o.Id,
        names: o.Names,
        image: o.Image,
        state: o.State,
        status: o.Status,
        running: (o.State || "").toLowerCase() === "running",
      });
    } catch {
      /* skip bad line */
    }
  }
  return { available: true, containers };
}

async function gatherSystemdServices() {
  const svcArgs = [
    "list-units", "--type=service", "--state=running,failed,activating",
    "--no-pager",
  ];
  const jsonTry = await runSystemctl([...svcArgs, "--output=json"]);
  if (jsonTry.ok) {
    const trimmed = jsonTry.stdout.trim();
    if (trimmed.startsWith("[")) {
      try {
        const arr = JSON.parse(trimmed);
        const units = filterSystemdInterest(
          (Array.isArray(arr) ? arr : []).map((u) => ({
            name: u.unit || u.name || "",
            load: u.load || "",
            active: u.active || "",
            sub: u.sub || "",
            description: u.description || "",
          })).filter((u) => u.name),
        );
        return { available: true, units };
      } catch {
        /* fall through */
      }
    }
  }

  const text = await runSystemctl([...svcArgs, "--no-legend"]);
  if (!text.ok) return { available: false, error: text.error, units: [] };

  const units = [];
  for (const line of text.stdout.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("●")) continue;
    const parts = t.split(/\s+/);
    if (parts.length < 4) continue;
    const name = parts[0];
    const load = parts[1];
    const active = parts[2];
    const sub = parts[3];
    const description = parts.slice(4).join(" ");
    units.push({ name, load, active, sub, description });
  }
  return { available: true, units: filterSystemdInterest(units) };
}

async function readText(p) {
  try { return await readFile(p, "utf8"); } catch { return null; }
}

async function gatherHostMetrics() {
  const meminfo = await readText(`${HOST_PROC}/meminfo`);
  const hostMounted = meminfo !== null;

  let memory;
  if (hostMounted) {
    const grab = (k) => {
      const m = new RegExp(`^${k}:\\s+(\\d+)\\s+kB`, "m").exec(meminfo);
      return m ? parseInt(m[1], 10) * 1024 : 0;
    };
    const total = grab("MemTotal");
    const available = grab("MemAvailable") || grab("MemFree");
    memory = { total, free: available, used: Math.max(0, total - available) };
  } else {
    const total = os.totalmem();
    const free = os.freemem();
    memory = { total, free, used: total - free };
  }

  let loadAvg, sysUptimeSec, hostname;
  if (hostMounted) {
    const la = await readText(`${HOST_PROC}/loadavg`);
    loadAvg = la ? la.trim().split(/\s+/).slice(0, 3).map(Number) : os.loadavg();
    const up = await readText(`${HOST_PROC}/uptime`);
    sysUptimeSec = up ? parseFloat(up.trim().split(/\s+/)[0]) : os.uptime();
    const hn = (await readText("/host/hostname")) || (await readText(`${HOST_PROC}/sys/kernel/hostname`));
    hostname = hn ? hn.trim() : os.hostname();
  } else {
    loadAvg = os.loadavg();
    sysUptimeSec = os.uptime();
    hostname = os.hostname();
  }

  let cpu;
  if (hostMounted) {
    const ci = await readText(`${HOST_PROC}/cpuinfo`);
    if (ci) {
      const m = /^model name\s*:\s*(.+)$/m.exec(ci);
      const cores = (ci.match(/^processor\s*:/gm) || []).length;
      cpu = { model: m ? m[1].trim() : "unknown", cores: cores || os.cpus().length, loadAvg };
    } else {
      const cpus = os.cpus();
      cpu = { model: cpus[0]?.model || "unknown", cores: cpus.length, loadAvg };
    }
  } else {
    const cpus = os.cpus();
    cpu = { model: cpus[0]?.model || "unknown", cores: cpus.length, loadAvg };
  }

  let osRelease = null;
  if (hostMounted) {
    const r = await readText("/host/os-release");
    if (r) {
      const grab = (k) => {
        const m = new RegExp(`^${k}=\"?([^\"\\n]+)\"?`, "m").exec(r);
        return m ? m[1] : null;
      };
      osRelease = grab("PRETTY_NAME") || grab("NAME");
    }
  }

  let kernel;
  if (hostMounted) {
    const k = await readText(`${HOST_PROC}/sys/kernel/osrelease`);
    kernel = k ? k.trim() : os.release();
  } else {
    kernel = os.release();
  }

  return { memory, cpu, sysUptimeSec, hostname, kernel, osRelease, hostMounted };
}

app.get("/api/system/stats", requireAdmin, async (req, res) => {
  try {
    const host = await gatherHostMetrics();
    const diskTarget = host.hostMounted ? HOST_ROOT : "/";

    const [diskVolumes, dockerStatus, systemdServices] = await Promise.all([
      gatherDiskVolumes(host.hostMounted),
      gatherDockerStatus(),
      gatherSystemdServices(),
    ]);

    let disk = null;
    try {
      const s = await statfs(diskTarget);
      const total = s.blocks * s.bsize;
      const free = s.bavail * s.bsize;
      disk = { total, free, used: total - free };
    } catch (err) {
      disk = { error: err.message };
    }

    let database = null;
    try {
      const counts = await pool.query(`
        SELECT
          (SELECT count(*)::int FROM messages) AS messages,
          (SELECT count(*)::int FROM experiences) AS experiences,
          (SELECT count(*)::int FROM projects) AS projects,
          (SELECT count(*)::int FROM photos) AS photos
      `);
      const size = await pool.query(
        "SELECT pg_database_size(current_database())::bigint AS size"
      );
      const conns = await pool.query(
        "SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database()"
      );
      database = {
        counts: counts.rows[0],
        sizeBytes: parseInt(size.rows[0].size, 10),
        connections: conns.rows[0].n,
      };
    } catch (err) {
      database = { error: err.message };
    }

    const mem = process.memoryUsage();

    res.json({
      timestamp: new Date().toISOString(),
      source: host.hostMounted ? "host" : "container",
      os: {
        platform: os.platform(),
        release: host.kernel,
        arch: os.arch(),
        hostname: host.hostname,
        prettyName: host.osRelease,
        uptimeSec: host.sysUptimeSec,
      },
      cpu: host.cpu,
      memory: host.memory,
      disk,
      disks: diskVolumes,
      docker: dockerStatus,
      systemd: systemdServices,
      process: {
        nodeVersion: process.version,
        pid: process.pid,
        uptimeSec: process.uptime(),
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
      },
      database,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ——— Translation proxy ———
app.post("/api/translate", async (req, res) => {
  const { q, source = "en", target } = req.body || {};
  if (!q || !target) return res.status(400).json({ error: "Missing q or target" });
  try {
    const ltRes = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, source, target, format: "text" }),
    });
    if (!ltRes.ok) {
      const err = await ltRes.text();
      return res.status(502).json({ error: err });
    }
    const data = await ltRes.json();
    res.json({ translatedText: data.translatedText });
  } catch (err) {
    res.status(502).json({ error: err.message });
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
