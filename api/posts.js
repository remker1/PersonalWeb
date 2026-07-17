// GET    /api/posts        — public: published only | admin: all
// POST   /api/posts        — admin: create post
// GET    /api/posts/:slug  — public if published, admin sees unpublished too
//   (routed here via the vercel.json rewrite /api/posts/:slug → /api/posts?slug=:slug
//    to stay under the Hobby-plan serverless function limit)
// PUT    /api/posts/:slug  — admin: update
// DELETE /api/posts/:slug  — admin: delete

import { getSupabase, setCors, isAdmin, sendSiteUpdateNotification } from "./_lib.js";

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string")
    return tags.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

async function handleItem(req, res, supabase, admin, slug) {
  // ── GET ──────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .single();
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
    await sendSiteUpdateNotification({
      action: "Updated",
      section: "Blog post",
      title: data.title,
      details: data.published ? "Published" : "Draft",
    });
    return res.json(data);
  }

  // ── DELETE ───────────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const { error } = await supabase.from("posts").delete().eq("slug", slug);
    if (error) return res.status(500).json({ error: error.message });
    await sendSiteUpdateNotification({ action: "Deleted", section: "Blog post", title: slug });
    return res.status(204).end();
  }

  res.status(405).json({ error: "Method not allowed" });
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = getSupabase();
  const admin = isAdmin(req);

  const { slug } = req.query;
  if (slug) return handleItem(req, res, supabase, admin, slug);

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
    const { title, slug: newSlug, excerpt, content, tags, published } = req.body ?? {};
    const { data, error } = await supabase
      .from("posts")
      .insert({
        title,
        slug: newSlug,
        excerpt: excerpt || "",
        content: content || "",
        tags: normalizeTags(tags),
        published: published ?? false,
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    await sendSiteUpdateNotification({
      action: "Created",
      section: "Blog post",
      title: data.title,
      details: data.published ? "Published" : "Draft",
    });
    return res.status(201).json(data);
  }

  res.status(405).json({ error: "Method not allowed" });
}
