// GET /api/photos        — public
// POST /api/photos       — admin: add one (data-URL auto-uploaded to Supabase Storage)
// PUT  /api/photos       — admin: replace all

import {
  getSupabase,
  setCors,
  isAdmin,
  uploadImageToSupabase,
  deleteImageFromSupabase,
  sendSiteUpdateNotification,
} from "./_lib.js";

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } }, // allow large base64 images
};

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = getSupabase();

  // ── GET ──────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("id", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ items: data ?? [] });
  }

  if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  // ── POST ─────────────────────────────────────────────────────────
  if (req.method === "POST") {
    let { url, alt } = req.body ?? {};
    try {
      if (url?.startsWith("data:image/"))
        url = await uploadImageToSupabase(supabase, url);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
    const { data, error } = await supabase
      .from("photos")
      .insert({ url, alt: alt || "" })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    await sendSiteUpdateNotification({ action: "Added", section: "Photo", title: data.alt || `ID ${data.id}` });
    return res.status(201).json(data);
  }

  // ── PUT (replace all) ─────────────────────────────────────────────
  if (req.method === "PUT") {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    // Delete old storage files for photos being replaced
    const { data: existing } = await supabase.from("photos").select("url");
    for (const row of existing ?? []) {
      await deleteImageFromSupabase(supabase, row.url);
    }

    const { error: delErr } = await supabase.from("photos").delete().neq("id", 0);
    if (delErr) return res.status(500).json({ error: delErr.message });

    if (items.length) {
      const rows = [];
      for (const item of items) {
        let url = item.url;
        try {
          if (url?.startsWith("data:image/"))
            url = await uploadImageToSupabase(supabase, url);
        } catch {
          /* keep original url on upload failure */
        }
        rows.push({ url, alt: item.alt || "" });
      }
      const { error } = await supabase.from("photos").insert(rows);
      if (error) return res.status(500).json({ error: error.message });
    }

    const { data } = await supabase
      .from("photos")
      .select("*")
      .order("id", { ascending: true });
    await sendSiteUpdateNotification({
      action: "Reordered or replaced",
      section: "Photos",
      details: `${items.length} item(s) saved`,
    });
    return res.json({ items: data ?? [] });
  }

  res.status(405).json({ error: "Method not allowed" });
}
