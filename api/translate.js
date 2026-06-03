// POST /api/translate  — proxy to LibreTranslate

import { setCors } from "./_lib.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { q, source = "en", target } = req.body ?? {};
  if (!q || !target) return res.status(400).json({ error: "Missing q or target" });

  const ltUrl = process.env.LIBRETRANSLATE_URL;
  if (!ltUrl) return res.status(503).json({ error: "Translation service not configured" });

  try {
    // ltUrl is e.g. https://translate.remker1.dev (no path needed) or http://host:5000
    const endpoint = ltUrl.endsWith("/translate") ? ltUrl : `${ltUrl}/translate`;
    const ltRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, source, target, format: "text" }),
    });
    if (!ltRes.ok) {
      const err = await ltRes.text();
      return res.status(502).json({ error: err });
    }
    const data = await ltRes.json();
    return res.json({ translatedText: data.translatedText });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
