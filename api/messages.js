// GET /api/messages   — admin: list all
// POST /api/messages  — public: submit contact form
// PUT  /api/messages  — admin: replace all

import {
  getSupabase,
  setCors,
  isAdmin,
  sendDiscordNotification,
  sendWebsiteErrorNotification,
} from "./_lib.js";
import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";

const MAX_NETWORK_DOWNLOAD_BYTES = 4_000_000;
let networkDownloadPayload;

function getNetworkDownloadPayload(bytes) {
  if (!networkDownloadPayload) networkDownloadPayload = randomBytes(MAX_NETWORK_DOWNLOAD_BYTES);
  return networkDownloadPayload.subarray(0, bytes);
}

function handleNetworkTest(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, no-transform");

  if (req.method === "GET") {
    const requestedBytes = Number.parseInt(req.query.bytes || "0", 10);
    const bytes = Number.isFinite(requestedBytes)
      ? Math.min(Math.max(requestedBytes, 0), MAX_NETWORK_DOWNLOAD_BYTES)
      : 0;
    if (bytes > 0) {
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Encoding", "identity");
      res.setHeader("Content-Length", String(bytes));
      return res.status(200).end(getNetworkDownloadPayload(bytes));
    }
    return res.status(200).json({ ok: true, timestamp: Date.now() });
  }

  if (req.method === "POST") {
    const received = Buffer.isBuffer(req.body)
      ? req.body.length
      : Buffer.byteLength(typeof req.body === "string" ? req.body : JSON.stringify(req.body || ""));
    return res.status(200).json({ ok: true, received });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

const ERROR_REPORT_HOSTS = new Set([
  "remker1.dev",
  "www.remker1.dev",
  "testers.remker1.dev",
  "localhost",
  "127.0.0.1",
]);

function errorReportIsAllowed(req) {
  const origin = req.headers.origin || req.headers.referer || "";
  try {
    return ERROR_REPORT_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.query.networkTest === "1") return handleNetworkTest(req, res);

  if (req.method === "POST" && req.query.clientError === "1") {
    if (!errorReportIsAllowed(req)) return res.status(403).json({ error: "Forbidden" });
    const { message, stack, source, page, userAgent } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing error message" });
    }
    await sendWebsiteErrorNotification({ message, stack, source, page, userAgent });
    return res.status(202).json({ ok: true });
  }

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
    const { name, email, message, source, website } = req.body ?? {};
    if (website) return res.status(202).json({ ok: true });
    if (![name, email, message].every((value) => typeof value === "string" && value.trim())) {
      return res.status(400).json({ error: "Name, email and message are required" });
    }
    const clean = {
      name: name.trim().slice(0, 120),
      email: email.trim().slice(0, 254),
      message: message.trim().slice(0, 4000),
    };
    const messageSource = source === "testers.remker1.dev" ? source : "remker1.dev";
    const { data, error } = await supabase
      .from("messages")
      .insert(clean)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    const discordDelivered = await sendDiscordNotification({ ...data, source: messageSource });
    if (!discordDelivered) {
      await sendWebsiteErrorNotification({
        message: "A contact message was saved, but its Discord notification failed.",
        source: "api/messages",
        page: messageSource,
      });
    }
    return res.status(201).json({ ...data, discordDelivered });
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
