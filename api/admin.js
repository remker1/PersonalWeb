// POST /api/admin  — legacy compatibility (ping + all old actions)

import {
  getSupabase,
  setCors,
  uploadImageToSupabase,
} from "./_lib.js";

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string")
    return tags.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { password, action, payload } = req.body ?? {};
  const adminPw = process.env.ADMIN_PASSWORD || "";
  if (!adminPw || password !== adminPw) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabase = getSupabase();

  try {
    switch (action) {
      case "ping":
        return res.json({ ok: true });

      case "getMessages": {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return res.json({ items: data ?? [] });
      }

      case "addExperience": {
        const { data, error } = await supabase
          .from("experiences")
          .insert({
            title: payload.title,
            company: payload.company,
            period: payload.period,
            description: payload.description,
          })
          .select()
          .single();
        if (error) throw error;
        return res.status(201).json(data);
      }

      case "deleteExperience": {
        const { error } = await supabase
          .from("experiences")
          .delete()
          .eq("id", payload.id);
        if (error) throw error;
        return res.status(204).end();
      }

      case "setExperiences": {
        await supabase.from("experiences").delete().neq("id", 0);
        if ((payload.items || []).length) {
          const { error } = await supabase.from("experiences").insert(
            payload.items.map(({ title, company, period, description }) => ({
              title, company, period, description,
            })),
          );
          if (error) throw error;
        }
        return res.json({ items: payload.items ?? [] });
      }

      case "addProject": {
        const { data, error } = await supabase
          .from("projects")
          .insert({
            title: payload.title,
            description: payload.description,
            tags: normalizeTags(payload.tags),
            github: payload.github,
            live: payload.live,
          })
          .select()
          .single();
        if (error) throw error;
        return res.status(201).json(data);
      }

      case "deleteProject": {
        const { error } = await supabase
          .from("projects")
          .delete()
          .eq("id", payload.id);
        if (error) throw error;
        return res.status(204).end();
      }

      case "setProjects": {
        await supabase.from("projects").delete().neq("id", 0);
        if ((payload.items || []).length) {
          const { error } = await supabase.from("projects").insert(
            payload.items.map(({ title, description, tags, github, live }) => ({
              title, description, tags: normalizeTags(tags), github, live,
            })),
          );
          if (error) throw error;
        }
        return res.json({ items: payload.items ?? [] });
      }

      case "addPhoto": {
        let url = payload.url;
        if (url?.startsWith("data:image/"))
          url = await uploadImageToSupabase(supabase, url);
        const { data, error } = await supabase
          .from("photos")
          .insert({ url, alt: payload.alt || "" })
          .select()
          .single();
        if (error) throw error;
        return res.status(201).json(data);
      }

      case "deletePhoto": {
        const { error } = await supabase
          .from("photos")
          .delete()
          .eq("id", payload.id);
        if (error) throw error;
        return res.status(204).end();
      }

      case "setPhotos": {
        await supabase.from("photos").delete().neq("id", 0);
        if ((payload.items || []).length) {
          const rows = [];
          for (const item of payload.items) {
            let url = item.url;
            if (url?.startsWith("data:image/"))
              url = await uploadImageToSupabase(supabase, url);
            rows.push({ url, alt: item.alt || "" });
          }
          const { error } = await supabase.from("photos").insert(rows);
          if (error) throw error;
        }
        return res.json({ items: payload.items ?? [] });
      }

      case "deleteMessage": {
        const { error } = await supabase
          .from("messages")
          .delete()
          .eq("id", payload.id);
        if (error) throw error;
        return res.status(204).end();
      }

      case "setMessages": {
        await supabase.from("messages").delete().neq("id", 0);
        if ((payload.items || []).length) {
          const { error } = await supabase.from("messages").insert(
            payload.items.map(({ name, email, message }) => ({
              name: name || "", email: email || "", message: message || "",
            })),
          );
          if (error) throw error;
        }
        return res.json({ items: payload.items ?? [] });
      }

      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
