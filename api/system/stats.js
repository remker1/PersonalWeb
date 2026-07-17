// GET /api/system/stats  — admin
// On Vercel: returns Supabase DB counts only (no host/OS access in serverless).
// On self-hosted Docker: the backend/server.js endpoint is used instead.

import { getSupabase, setCors, isAdmin } from "../_lib.js";
import { Buffer } from "node:buffer";

const MAX_DOWNLOAD_BYTES = 2_000_000;

function handleNetworkTest(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method === "GET") {
    const requestedBytes = Number.parseInt(req.query.bytes || "0", 10);
    const bytes = Number.isFinite(requestedBytes) ? Math.min(Math.max(requestedBytes, 0), MAX_DOWNLOAD_BYTES) : 0;
    if (bytes > 0) {
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Length", String(bytes));
      return res.status(200).end(Buffer.alloc(bytes, 0xa5));
    }
    return res.status(200).json({ ok: true, timestamp: Date.now() });
  }

  if (req.method === "POST") {
    const received = Buffer.isBuffer(req.body)
      ? req.body.length
      : Buffer.byteLength(typeof req.body === "string" ? req.body : JSON.stringify(req.body || ""));
    return res.status(200).json({ ok: true, received });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.query.networkTest === "1") return handleNetworkTest(req, res);
  if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const supabase = getSupabase();
  let database = null;

  try {
    const [messages, experiences, projects, photos] = await Promise.all([
      supabase.from("messages").select("*", { count: "exact", head: true }),
      supabase.from("experiences").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("photos").select("*", { count: "exact", head: true }),
    ]);
    database = {
      counts: {
        messages: messages.count ?? 0,
        experiences: experiences.count ?? 0,
        projects: projects.count ?? 0,
        photos: photos.count ?? 0,
      },
    };
  } catch (err) {
    database = { error: err.message };
  }

  return res.json({
    timestamp: new Date().toISOString(),
    source: "serverless",
    database,
    // OS / CPU / disk / docker not available in serverless environment
    os: null,
    cpu: null,
    memory: null,
    disk: null,
    disks: null,
    docker: null,
    systemd: null,
    process: {
      nodeVersion: process.version,
      uptimeSec: process.uptime(),
      rss: process.memoryUsage().rss,
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
    },
  });
}
