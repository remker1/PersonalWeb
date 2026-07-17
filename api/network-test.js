import { setCors } from "./_lib.js";
import { Buffer } from "node:buffer";

const MAX_DOWNLOAD_BYTES = 2_000_000;

export default function handler(req, res) {
  setCors(res);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const requestedBytes = Number.parseInt(req.query.bytes || "0", 10);
    const bytes = Number.isFinite(requestedBytes) ? Math.min(Math.max(requestedBytes, 0), MAX_DOWNLOAD_BYTES) : 0;
    if (bytes > 0) {
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Length", String(bytes));
      return res.status(200).end(Buffer.alloc(bytes, 0xa5));
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
