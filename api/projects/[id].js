// DELETE /api/projects/:id  — admin

import { getSupabase, setCors, isAdmin } from "../_lib.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;
  const supabase = getSupabase();

  if (req.method === "DELETE") {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.status(405).json({ error: "Method not allowed" });
}
