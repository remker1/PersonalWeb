// Shared helpers for all Vercel serverless API functions

import { createClient } from "@supabase/supabase-js";

/** Lazily-created Supabase client (service role — full DB access, safe server-side only). */
export function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
}

/** Set permissive CORS headers for every response. */
export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

/** Return true when the request carries the correct admin Bearer token. */
export function isAdmin(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const pw = process.env.ADMIN_PASSWORD || "";
  return Boolean(pw && token === pw);
}

/**
 * Convert a base64 data-URL to a Supabase Storage upload and return the public URL.
 * If the input is already a plain URL it is returned unchanged.
 */
export async function uploadImageToSupabase(supabase, dataUrl) {
  const match =
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(
      dataUrl,
    );
  if (!match) return dataUrl; // already an external URL

  const contentType = match[1];
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");

  const extMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/svg+xml": "svg",
  };
  const ext = extMap[contentType] || "bin";
  const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("photos")
    .upload(filename, buffer, { contentType, upsert: false });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from("photos").getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Try to delete the file from Supabase Storage when a photo row is removed.
 * Silently ignores errors (e.g. external URLs, already-deleted files).
 */
export async function deleteImageFromSupabase(supabase, url) {
  if (!url || typeof url !== "string") return;
  const supabaseUrl = process.env.SUPABASE_URL || "";
  if (!url.startsWith(supabaseUrl)) return; // external URL, nothing to do

  // URL shape: <SUPABASE_URL>/storage/v1/object/public/photos/<filename>
  const m = /\/storage\/v1\/object\/public\/photos\/(.+)$/.exec(url);
  if (!m) return;
  const filename = m[1];
  await supabase.storage.from("photos").remove([filename]).catch(() => {});
}

/** Send Discord notification for a new contact message. */
export async function sendDiscordNotification(entry) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || "";
  if (!webhookUrl) return false;
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Personal Website Messages",
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: `New message from ${entry.name || "someone"}`,
            color: 0x5865f2,
            fields: [
              { name: "Name", value: entry.name || "N/A", inline: true },
              { name: "Email", value: entry.email || "N/A", inline: true },
              { name: "Source", value: entry.source || "remker1.dev", inline: true },
              { name: "Message", value: entry.message || "(empty)" },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Send a non-fatal Discord notification after an admin content update succeeds. */
export async function sendSiteUpdateNotification({ action, section, title, details }) {
  const webhookUrl = process.env.DISCORD_WEBSITE_WEBHOOK_URL || "";
  if (!webhookUrl) return;

  const fields = [
    { name: "Section", value: section, inline: true },
    { name: "Action", value: action, inline: true },
  ];
  if (title) fields.push({ name: "Item", value: String(title).slice(0, 1024) });
  if (details) fields.push({ name: "Details", value: String(details).slice(0, 1024) });

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Personal Website Updates",
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: "Website content updated",
            url: "https://testers.remker1.dev",
            color: 0x57f287,
            fields,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch {
    /* notifications must never block a successful content update */
  }
}

/** Send a non-fatal notification when the website reports an unexpected error. */
export async function sendWebsiteErrorNotification({ message, stack, source, page, userAgent }) {
  const webhookUrl = process.env.DISCORD_WEBSITE_WEBHOOK_URL || "";
  if (!webhookUrl) return;

  const fields = [
    { name: "Source", value: String(source || "Website").slice(0, 1024), inline: true },
    { name: "Page", value: String(page || "Unknown").slice(0, 1024), inline: true },
    { name: "Error", value: String(message || "Unknown error").slice(0, 1024) },
  ];
  if (stack) fields.push({ name: "Stack", value: `\`\`\`\n${String(stack).slice(0, 900)}\n\`\`\`` });
  if (userAgent) fields.push({ name: "Browser", value: String(userAgent).slice(0, 1024) });

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Personal Website Alerts",
        allowed_mentions: { parse: [] },
        embeds: [{
          title: "Website error reported",
          color: 0xed4245,
          fields,
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch {
    /* error reporting must never create another application failure */
  }
}
