// POST /api/translate
// Uses MyMemory (free, no API key) with optional email for higher limits.
// Alternatively falls back to a self-hosted LibreTranslate if LIBRETRANSLATE_URL is set.

import { setCors } from "./_lib.js";

const LANG_MAP = {
  zh: "zh-CN",
  en: "en-GB",
};

function normLang(code) {
  return LANG_MAP[code] || code;
}

async function translateMyMemory(q, source, target) {
  const langpair = `${normLang(source)}|${normLang(target)}`;
  const email = process.env.MYMEMORY_EMAIL || "";
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", q);
  url.searchParams.set("langpair", langpair);
  if (email) url.searchParams.set("de", email);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json();
  if (data.responseStatus !== 200) throw new Error(data.responseDetails || "Translation failed");
  return data.responseData.translatedText;
}

async function translateLibre(q, source, target) {
  const ltUrl = process.env.LIBRETRANSLATE_URL;
  const endpoint = ltUrl.endsWith("/translate") ? ltUrl : `${ltUrl}/translate`;
  const body = { q, source, target, format: "text" };
  const apiKey = process.env.LIBRETRANSLATE_API_KEY;
  if (apiKey) body.api_key = apiKey;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.translatedText;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { q, source = "en", target } = req.body ?? {};
  if (!q || !target) return res.status(400).json({ error: "Missing q or target" });

  try {
    let translatedText;

    if (process.env.LIBRETRANSLATE_URL) {
      // Prefer self-hosted / paid LibreTranslate if configured
      translatedText = await translateLibre(q, source, target);
    } else {
      // Default: MyMemory (free, no key needed)
      translatedText = await translateMyMemory(q, source, target);
    }

    return res.json({ translatedText });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
