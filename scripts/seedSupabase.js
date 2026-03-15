import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import translations from "../src/data/translations.js";

// Load env for local seeding: prefer .env.local, then .env
dotenv.config({ path: ".env.local" });
dotenv.config();

/**
 * Seeds Supabase tables with the existing content from the site:
 * - experiences: from translations.en.experience.roles
 * - projects: from translations.en.projects.items (+ optional hardcoded links if present)
 *
 * Requires env:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 * - SEED_REPLACE_ALL=1 (default) – deletes existing rows before inserting
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REPLACE_ALL = (process.env.SEED_REPLACE_ALL ?? "1") === "1";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function withLinks(projects) {
  // Keep in sync with src/components/Projects.jsx default links.
  const projectLinks = [
    { github: "https://git.cs.usask.ca/xpo285/cmpt370-g29", live: "#" },
    { github: "https://github.com/remker1/USask-GPA-Calculator", live: "#" },
  ];
  return projects.map((p, i) => ({
    title: p.title,
    description: p.description,
    tags: Array.isArray(p.tags) ? p.tags : [],
    github: projectLinks[i]?.github || "",
    live: projectLinks[i]?.live || "",
  }));
}

async function replaceAll(table, rows) {
  if (REPLACE_ALL) {
    // Supabase requires a filter; this pattern deletes all rows.
    const { error: delErr } = await supabase.from(table).delete().gte("id", 0);
    if (delErr) throw delErr;
  }
  if (!rows.length) return;
  const { error: insErr } = await supabase.from(table).insert(rows);
  if (insErr) throw insErr;
}

async function main() {
  const experiences = translations.en.experience.roles.map((r) => ({
    title: r.title,
    company: r.company,
    period: r.period,
    description: r.description,
  }));

  const projects = withLinks(translations.en.projects.items);

  console.log(`Seeding experiences: ${experiences.length}`);
  await replaceAll("experiences", experiences);

  console.log(`Seeding projects: ${projects.length}`);
  await replaceAll("projects", projects);

  console.log("Done.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

