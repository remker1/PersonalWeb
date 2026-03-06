import { createClient } from "@supabase/supabase-js";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function supabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

function unauthorized(res) {
  res.status(401).json({ error: "Unauthorized" });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password, action, payload } = req.body || {};
  if (password !== ADMIN_PASSWORD || !ADMIN_PASSWORD) {
    return unauthorized(res);
  }

  const db = supabaseAdmin();
  if (!db) {
    return res.status(500).json({ error: "Server misconfigured: Supabase" });
  }

  try {
    switch (action) {
      case "ping": {
        return res.status(200).json({ ok: true });
      }
      case "getMessages": {
        const { data, error } = await db.from("messages").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return res.status(200).json({ items: data || [] });
      }
      case "addExperience": {
        const { data, error } = await db.from("experiences").insert(payload).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }
      case "deleteExperience":
        await db.from("experiences").delete().eq("id", payload.id);
        return res.status(204).end();
      case "setExperiences":
        await db.from("experiences").delete().gte("id", 0);
        if (payload.items?.length) {
          await db.from("experiences").insert(payload.items.map(({ id, ...r }) => r));
        }
        return res.status(200).json({ items: payload.items || [] });
      case "addProject": {
        const row = { ...payload };
        if (typeof row.tags === "string") row.tags = payload.tags.split(",").map((t) => t.trim()).filter(Boolean);
        const { data, error } = await db.from("projects").insert(row).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }
      case "deleteProject":
        await db.from("projects").delete().eq("id", payload.id);
        return res.status(204).end();
      case "setProjects":
        await db.from("projects").delete().gte("id", 0);
        if (payload.items?.length) {
          await db.from("projects").insert(payload.items.map(({ id, ...r }) => r));
        }
        return res.status(200).json({ items: payload.items || [] });
      case "addPhoto": {
        const { data, error } = await db.from("photos").insert(payload).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      }
      case "deletePhoto":
        await db.from("photos").delete().eq("id", payload.id);
        return res.status(204).end();
      case "setPhotos":
        await db.from("photos").delete().gte("id", 0);
        if (payload.items?.length) {
          await db.from("photos").insert(payload.items.map(({ id, ...r }) => r));
        }
        return res.status(200).json({ items: payload.items || [] });
      case "deleteMessage":
        await db.from("messages").delete().eq("id", payload.id);
        return res.status(204).end();
      case "setMessages":
        await db.from("messages").delete().gte("id", 0);
        if (payload.items?.length) {
          await db.from("messages").insert(payload.items.map(({ id, ...r }) => r));
        }
        return res.status(200).json({ items: payload.items || [] });
      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (err) {
    console.error("Admin API error:", err);
    return res.status(500).json({ error: err.message || "Database error" });
  }
}
