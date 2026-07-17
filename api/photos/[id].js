// DELETE /api/photos/:id  — admin (also removes file from Supabase Storage)

import {
  getSupabase,
  setCors,
  isAdmin,
  deleteImageFromSupabase,
  sendSiteUpdateNotification,
} from "../_lib.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;
  const supabase = getSupabase();

  if (req.method === "DELETE") {
    // Fetch the URL first so we can clean up storage
    const { data: row } = await supabase
      .from("photos")
      .select("url")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("photos").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });

    if (row?.url) await deleteImageFromSupabase(supabase, row.url);

    await sendSiteUpdateNotification({ action: "Deleted", section: "Photo", title: `ID ${id}` });
    return res.status(204).end();
  }

  res.status(405).json({ error: "Method not allowed" });
}
