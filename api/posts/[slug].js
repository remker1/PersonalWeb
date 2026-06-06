// GET    /api/posts/:slug  — public if published, admin sees unpublished too
// PUT    /api/posts/:slug  — admin: update
// DELETE /api/posts/:slug  — admin: delete

import { getSupabase, setCors, isAdmin } from "../_lib.js";

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string")
    return tags.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { slug } = req.query;
  const supabase = getSupabase();
  const admin = isAdmin(req);

  // ── GET ──────────────────────────────────────────────────────────
  if (req.method === "GET") {
    let query = supabase.from("posts").select("*").eq("slug", slug).single();
    const { data, error } = await query;
    if (error || !data) return res.status(404).json({ error: "Post not found" });
    if (!data.published && !admin) return res.status(404).json({ error: "Post not found" });
    return res.json(data);
  }

  if (!admin) return res.status(401).json({ error: "Unauthorized" });

  // ── PUT ──────────────────────────────────────────────────────────
  if (req.method === "PUT") {
    const { title, slug: newSlug, excerpt, content, tags, published } = req.body ?? {};
    const { data, error } = await supabase
      .from("posts")
      .update({
        title,
        slug: newSlug || slug,
        excerpt: excerpt || "",
        content: content || "",
        tags: normalizeTags(tags),
        published: published ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // ── DELETE ───────────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const { error } = await supabase.from("posts").delete().eq("slug", slug);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.status(405).json({ error: "Method not allowed" });
}
