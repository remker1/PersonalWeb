// GET /api/system/stats  — admin
// On Vercel: returns Supabase DB counts only (no host/OS access in serverless).
// On self-hosted Docker: the backend/server.js endpoint is used instead.

import { getSupabase, setCors, isAdmin } from "../_lib.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
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
