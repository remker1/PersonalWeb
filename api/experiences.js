// GET /api/experiences        — public
// POST /api/experiences       — admin: add one
// PUT  /api/experiences       — admin: replace all

import { getSupabase, setCors, isAdmin } from "./_lib.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = getSupabase();

  // ── GET ──────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ items: data ?? [] });
  }

  if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  // ── POST ─────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const { title, company, period, description } = req.body ?? {};
    const { data, error } = await supabase
      .from("experiences")
      .insert({ title, company, period, description })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // ── PUT (replace all) ─────────────────────────────────────────────
  if (req.method === "PUT") {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const { error: delErr } = await supabase
      .from("experiences")
      .delete()
      .neq("id", 0);
    if (delErr) return res.status(500).json({ error: delErr.message });

    if (items.length) {
      const { error } = await supabase.from("experiences").insert(
        items.map(({ title, company, period, description }) => ({
          title,
          company,
          period,
          description,
        })),
      );
      if (error) return res.status(500).json({ error: error.message });
    }

    const { data } = await supabase
      .from("experiences")
      .select("*")
      .order("created_at", { ascending: false });
    return res.json({ items: data ?? [] });
  }

  res.status(405).json({ error: "Method not allowed" });
}
