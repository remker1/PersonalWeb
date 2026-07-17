// GET /api/projects        — public
// POST /api/projects       — admin: add one
// PUT  /api/projects       — admin: replace all

import { getSupabase, setCors, isAdmin, sendSiteUpdateNotification } from "./_lib.js";

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string")
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  return [];
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = getSupabase();

  // ── GET ──────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("id", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ items: data ?? [] });
  }

  if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  // ── POST ─────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const { title, description, tags, github, live } = req.body ?? {};
    const { data, error } = await supabase
      .from("projects")
      .insert({ title, description, tags: normalizeTags(tags), github, live })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    await sendSiteUpdateNotification({ action: "Added", section: "Project", title: data.title });
    return res.status(201).json(data);
  }

  // ── PUT (replace all) ─────────────────────────────────────────────
  if (req.method === "PUT") {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const { error: delErr } = await supabase
      .from("projects")
      .delete()
      .neq("id", 0);
    if (delErr) return res.status(500).json({ error: delErr.message });

    if (items.length) {
      const { error } = await supabase.from("projects").insert(
        items.map(({ title, description, tags, github, live }) => ({
          title,
          description,
          tags: normalizeTags(tags),
          github,
          live,
        })),
      );
      if (error) return res.status(500).json({ error: error.message });
    }

    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("id", { ascending: true });
    await sendSiteUpdateNotification({
      action: "Reordered or replaced",
      section: "Projects",
      details: `${items.length} item(s) saved`,
    });
    return res.json({ items: data ?? [] });
  }

  res.status(405).json({ error: "Method not allowed" });
}
