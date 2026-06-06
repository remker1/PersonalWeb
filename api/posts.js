// GET  /api/posts          — public: published only | admin: all
// POST /api/posts          — admin: create post

import { getSupabase, setCors, isAdmin } from "./_lib.js";

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string")
    return tags.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = getSupabase();
  const admin = isAdmin(req);

  // ── GET ──────────────────────────────────────────────────────────
  if (req.method === "GET") {
    let query = supabase
      .from("posts")
      .select("id, title, slug, excerpt, tags, published, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (!admin) query = query.eq("published", true);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ items: data ?? [] });
  }

  if (!admin) return res.status(401).json({ error: "Unauthorized" });

  // ── POST ─────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const { title, slug, excerpt, content, tags, published } = req.body ?? {};
    const { data, error } = await supabase
      .from("posts")
      .insert({
        title,
        slug,
        excerpt: excerpt || "",
        content: content || "",
        tags: normalizeTags(tags),
        published: published ?? false,
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  res.status(405).json({ error: "Method not allowed" });
}
