import { useState, useEffect } from "react";
import { translateText } from "../api";

// Session-level in-memory cache: "lang:text" -> translatedText
const memCache = new Map();

function cacheKey(lang, text) {
  return `${lang}:\x00${text}`;
}

function readCache(lang, text) {
  const key = cacheKey(lang, text);
  if (memCache.has(key)) return memCache.get(key);
  try {
    const val = sessionStorage.getItem(`lt:${key}`);
    if (val !== null) {
      memCache.set(key, val);
      return val;
    }
  } catch { /* ignore */ }
  return null;
}

function writeCache(lang, text, translated) {
  const key = cacheKey(lang, text);
  memCache.set(key, translated);
  try {
    sessionStorage.setItem(`lt:${key}`, translated);
  } catch { /* ignore */ }
}

async function translateField(text, lang) {
  if (!text) return text;
  const cached = readCache(lang, text);
  if (cached !== null) return cached;
  const translated = await translateText(text, lang);
  writeCache(lang, text, translated);
  return translated;
}

async function translateItem(item, lang, fields) {
  const result = { ...item };
  await Promise.all(
    fields.map(async (field) => {
      if (item[field]) {
        result[field] = await translateField(item[field], lang);
      }
    })
  );
  return result;
}

/**
 * Returns a translated copy of `items` for the given `lang`.
 * Falls back to original items if translation fails.
 * Only translates the specified `fields`; all other fields are passed through unchanged.
 */
export function useTranslatedItems(items, lang, fields) {
  const [translated, setTranslated] = useState(items);

  useEffect(() => {
    if (lang === "en") {
      setTranslated(items);
      return;
    }
    let cancelled = false;
    Promise.all(items.map((item) => translateItem(item, lang, fields)))
      .then((results) => { if (!cancelled) setTranslated(results); })
      .catch(() => { if (!cancelled) setTranslated(items); });
    return () => { cancelled = true; };
  // fields is a stable literal array at call site, join it to avoid referential instability
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, lang, fields.join(",")]);

  return translated;
}
