// DELETE /api/experiences/:id  — admin

import { getSupabase, setCors, isAdmin, sendSiteUpdateNotification } from "../_lib.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;
  const supabase = getSupabase();

  if (req.method === "DELETE") {
    const { error } = await supabase
      .from("experiences")
      .delete()
      .eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    await sendSiteUpdateNotification({ action: "Deleted", section: "Experience", title: `ID ${id}` });
    return res.status(204).end();
  }

  res.status(405).json({ error: "Method not allowed" });
}
