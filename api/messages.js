// GET /api/messages   — admin: list all
// POST /api/messages  — public: submit contact form
// PUT  /api/messages  — admin: replace all

import { getSupabase, setCors, isAdmin, sendDiscordNotification } from "./_lib.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = getSupabase();

  // ── GET (admin only) ──────────────────────────────────────────────
  if (req.method === "GET") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ items: data ?? [] });
  }

  // ── POST (public — contact form) ──────────────────────────────────
  if (req.method === "POST") {
    const { name, email, message } = req.body ?? {};
    const { data, error } = await supabase
      .from("messages")
      .insert({ name: name || "", email: email || "", message: message || "" })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    sendDiscordNotification(data); // fire-and-forget
    return res.status(201).json(data);
  }

  if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  // ── PUT (replace all — admin) ─────────────────────────────────────
  if (req.method === "PUT") {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const { error: delErr } = await supabase
      .from("messages")
      .delete()
      .neq("id", 0);
    if (delErr) return res.status(500).json({ error: delErr.message });

    if (items.length) {
      const { error } = await supabase.from("messages").insert(
        items.map(({ name, email, message }) => ({
          name: name || "",
          email: email || "",
          message: message || "",
        })),
      );
      if (error) return res.status(500).json({ error: error.message });
    }

    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });
    return res.json({ items: data ?? [] });
  }

  res.status(405).json({ error: "Method not allowed" });
}
