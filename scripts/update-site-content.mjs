#!/usr/bin/env node
/**
 * One-off script to sync the live site's Experience & Projects (Supabase)
 * with the latest resume. Static text (hero/bio/skills) is in the repo and
 * already deployed via git — this script only touches the live database.
 *
 * Your admin password stays in your shell's environment and is never printed.
 *
 * Preview first (changes nothing):
 *   ADMIN_PASSWORD='your-admin-password' DRY_RUN=1 node scripts/update-site-content.mjs
 *
 * Apply for real:
 *   ADMIN_PASSWORD='your-admin-password' node scripts/update-site-content.mjs
 *
 * Optional:
 *   SITE_URL=https://www.remker1.dev   (default)
 *
 * Safe to re-run: experiences end as exactly the two below (newest on top);
 * projects are REPLACED wholesale with exactly the list below, in order.
 */

const BASE = (process.env.SITE_URL || "https://www.remker1.dev").replace(/\/$/, "");
const PASSWORD = process.env.ADMIN_PASSWORD || "";
const DRY_RUN = process.env.DRY_RUN === "1";

if (!PASSWORD) {
  console.error(
    "✖ ADMIN_PASSWORD is not set.\n" +
      "  Run:  ADMIN_PASSWORD='your-admin-password' node scripts/update-site-content.mjs",
  );
  process.exit(1);
}

const authHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${PASSWORD}`,
};

// ── Desired content ─────────────────────────────────────

// Experiences are shown newest-first (by created_at), so the LAST one posted
// appears at the top. Post older -> newer so Uniway ends up on top.
const EXPERIENCES_OLDEST_FIRST = [
  {
    title: "Full Stack Developer Intern",
    company: "GridLabel",
    period: "Apr 2025 - Jun 2025 · 2 months",
    description:
      "Built cross-platform mobile interfaces in Flutter for iOS and Android, including interactive OpenStreetMap maps with routing hand-off to Google Maps and Apple Maps. Designed and deployed a local server and PostgreSQL database for demo and testing environments, reducing production risk. Explored real-time communication over WebSockets and image-acquisition technologies (WIA, TWAIN) through Python side projects. Tech: Flutter, Node.js, PostgreSQL, REST APIs, Python, WebSockets.",
  },
  {
    title: "Computer Technician",
    company: "Uniway Computers",
    period: "Jun 2025 - Present · 1 year 5 months",
    description:
      "Diagnose and repair hardware issues — component replacements, system upgrades, and custom-built PCs to client specifications. Built an internal tool to batch-refurbish used laptops, verifying system configurations and diagnosing component health to streamline troubleshooting. Supported an enterprise-wide ERP rollout by managing, cross-verifying, and backing up core business data on AWS-hosted Ubuntu servers over SSH.",
  },
];

// Projects are shown by id ascending = the order below. The PUT endpoint
// replaces ALL projects with exactly this list, so keep every one you want.
const PROJECTS_IN_ORDER = [
  {
    title: "QuickReports",
    description:
      "A Windows desktop app (Qt 6 / C++) that produces a full system summary — storage, motherboard, BIOS, battery — alongside admin utilities (disk clone/partition, Windows Update, device-encryption toggle) and an accuracy-first hardware tester: keyboard (Raw Input NKRO + switch-chatter detection), mouse (measured polling rate), camera, speaker/mic, display (precise refresh rate, HDR, EDID) and more. Multilingual (EN/FR/ZH); anything the OS can't report is shown as \"not supported\" rather than estimated.",
    tags: ["C++", "Qt 6", "Windows", "CMake", "Hardware Diagnostics"],
    github: "https://github.com/remker1/QuickReportOpen",
    live: "#",
  },
  {
    title: "RenoMana",
    description:
      "As Front End Lead, planned and delivered four core features from user stories — employee management, authentication, project management, and inventory management — for a business management platform. Built the desktop app in JavaFX for its cross-platform support and rich component library, and worked closely with the backend team to integrate features, resolve API issues, and stabilize deployment.",
    tags: ["Java", "JavaFX", "Python (Flask)", "MongoDB", "REST APIs", "Docker"],
    github: "https://git.cs.usask.ca/xpo285/cmpt370-g29",
    live: "#",
  },
  {
    title: "Personal Portfolio Website",
    description:
      "A high-performance personal portfolio (remker1.dev) showcasing my projects and professional experience. Built with React and Vite using a modular component architecture and Tailwind CSS, with Supabase as a backend-as-a-service for database, authentication, and content management. Deployed on Vercel with a CI/CD pipeline for automated builds and optimized edge delivery.",
    tags: ["React", "Vite", "JavaScript", "Tailwind CSS", "Supabase", "Vercel"],
    github: "https://github.com/remker1/PersonalWeb",
    live: "https://www.remker1.dev",
  },
  {
    title: "USask GPA Estimator",
    description:
      "An unofficial GPA calculator that parses USask unofficial transcript PDFs and gives a quick academic standing estimate. It supports editing grades, adding future courses for simulation, and handling retaken courses by using the newest grade.",
    tags: ["Python", "Tkinter", "PDF Parsing", "Data Processing"],
    github: "https://github.com/remker1/USask-GPA-Calculator",
    live: "#",
  },
];

// ── Helpers ───────────────────────────────────────────

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${options.method || "GET"} ${path} -> ${res.status} ${body}`);
  }
  return res.status === 204 ? null : res.json();
}

async function checkAuth() {
  // GETs are public; verify the password with an admin-only read.
  const res = await fetch(`${BASE}/api/messages`, {
    headers: { Authorization: `Bearer ${PASSWORD}` },
  });
  if (res.status === 401) throw new Error("Admin password rejected (401). Check ADMIN_PASSWORD.");
}

// ── Main ──────────────────────────────────────────────

async function main() {
  console.log(`-> Target: ${BASE}${DRY_RUN ? "  (DRY RUN — no changes)" : ""}`);
  await checkAuth();
  console.log("✓ Admin password accepted");

  // Experiences: post the desired entries (oldest->newest), then remove the
  // previously-existing ones so we end with exactly these two.
  const existingExp = (await api("/api/experiences")).items || [];
  console.log(`\nExperiences: ${existingExp.length} existing -> replacing with 2 updated entries`);
  const oldExpIds = existingExp.map((e) => e.id);

  for (const exp of EXPERIENCES_OLDEST_FIRST) {
    if (DRY_RUN) {
      console.log(`  would add: ${exp.title} @ ${exp.company}`);
      continue;
    }
    await api("/api/experiences", { method: "POST", headers: authHeaders, body: JSON.stringify(exp) });
    console.log(`  + added: ${exp.title} @ ${exp.company}`);
  }
  for (const id of oldExpIds) {
    if (DRY_RUN) {
      console.log(`  would delete old experience id ${id}`);
      continue;
    }
    await api(`/api/experiences/${id}`, { method: "DELETE", headers: authHeaders });
    console.log(`  - removed old experience id ${id}`);
  }

  // Projects: replace the whole list with PROJECTS_IN_ORDER (one PUT).
  const existingProj = (await api("/api/projects")).items || [];
  console.log(
    `\nProjects: ${existingProj.length} existing -> replacing with ${PROJECTS_IN_ORDER.length} entries`,
  );
  for (const p of PROJECTS_IN_ORDER) console.log(`  • ${p.title}`);
  if (DRY_RUN) {
    console.log("  (dry run — not written)");
  } else {
    await api("/api/projects", {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ items: PROJECTS_IN_ORDER }),
    });
    console.log("  ✓ projects replaced");
  }

  console.log(`\n✓ Done${DRY_RUN ? " (dry run)" : ""}.`);
}

main().catch((err) => {
  console.error(`\n✖ Failed: ${err.message}`);
  process.exit(1);
});
