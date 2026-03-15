import { useEffect, useRef, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";

/* ═══════════════════════════════════════════════════════════════════
   SEASON DETECTION
   Northern hemisphere: Spring Mar 20 – Jun 20, Summer Jun 21 – Sep 22,
   Autumn Sep 23 – Dec 20, Winter Dec 21 – Mar 19
   ═══════════════════════════════════════════════════════════════════ */
const VALID_SEASONS = ["spring", "summer", "autumn", "winter"];
export const SEASON_STORAGE_KEY = "pw_season_override";

function getSeasonByDate() {
  const now = new Date();
  const m = now.getMonth() + 1; // 1-12
  const d = now.getDate();
  const md = m * 100 + d; // e.g. 321 = March 21
  if (md >= 320 && md <= 620) return "spring";
  if (md >= 621 && md <= 922) return "summer";
  if (md >= 923 && md <= 1220) return "autumn";
  return "winter";
}

export function getSeason() {
  try {
    const override = localStorage.getItem(SEASON_STORAGE_KEY);
    if (override && VALID_SEASONS.includes(override)) return override;
  } catch {}
  return getSeasonByDate();
}

/* ═══════════════════════════════════════════════════════════════════
   MOUNTAIN SILHOUETTE SVG PATHS  (viewBox 0 0 1440 400)
   Shared across all seasons – colors change per season
   ═══════════════════════════════════════════════════════════════════ */
const MOUNTAIN_PATHS = [
  {
    d: "M0,320 Q40,260 100,290 Q160,210 240,250 Q320,160 420,210 Q500,130 600,180 Q680,100 780,160 Q860,80 960,140 Q1040,60 1140,120 Q1220,50 1320,100 Q1380,70 1440,90 L1440,400 L0,400 Z",
    height: "40vh",
    parallax: 0.06,
  },
  {
    d: "M0,310 Q70,260 150,280 Q230,200 330,240 Q420,160 520,210 Q600,140 700,185 Q780,110 880,165 Q960,95 1060,150 Q1140,85 1240,135 Q1320,90 1400,120 L1440,110 L1440,400 L0,400 Z",
    height: "32vh",
    parallax: 0.14,
  },
  {
    d: "M0,300 Q90,250 180,275 Q280,210 380,250 Q460,190 560,230 Q640,175 740,215 Q830,155 930,200 Q1020,145 1120,190 Q1200,140 1300,175 Q1380,150 1440,170 L1440,400 L0,400 Z",
    height: "25vh",
    parallax: 0.24,
  },
];

/* ── Tree silhouettes on front mountain ridge ── */
const TREES_PATH =
  "M180,275 l-4,0 l4,-18 l4,18 z " +
  "M200,270 l-5,0 l5,-22 l5,22 z " +
  "M215,273 l-3,0 l3,-15 l3,15 z " +
  "M390,248 l-5,0 l5,-24 l5,24 z " +
  "M410,252 l-4,0 l4,-18 l4,18 z " +
  "M425,250 l-3,0 l3,-14 l3,14 z " +
  "M570,228 l-5,0 l5,-22 l5,22 z " +
  "M585,232 l-4,0 l4,-16 l4,16 z " +
  "M600,226 l-6,0 l6,-26 l6,26 z " +
  "M750,213 l-5,0 l5,-22 l5,22 z " +
  "M770,218 l-4,0 l4,-16 l4,16 z " +
  "M940,198 l-5,0 l5,-24 l5,24 z " +
  "M960,202 l-4,0 l4,-18 l4,18 z " +
  "M975,196 l-6,0 l6,-28 l6,28 z " +
  "M1130,188 l-5,0 l5,-22 l5,22 z " +
  "M1150,192 l-4,0 l4,-16 l4,16 z " +
  "M1310,173 l-5,0 l5,-24 l5,24 z " +
  "M1330,178 l-4,0 l4,-16 l4,16 z ";

/* ── Bare-branch tree silhouettes for autumn/winter ── */
const BARE_TREES_PATH =
  "M180,275 l0,-20 l-6,-8 l4,4 l2,4 l0,-10 l5,-7 l-3,5 l-2,4 z " +
  "M200,270 l0,-24 l-7,-9 l5,5 l2,4 l0,-12 l6,-8 l-4,6 l-2,5 z " +
  "M390,248 l0,-26 l-8,-10 l5,5 l3,5 l0,-14 l7,-9 l-4,6 l-3,5 z " +
  "M570,228 l0,-24 l-7,-9 l5,5 l2,4 l0,-12 l6,-8 l-4,5 l-2,5 z " +
  "M750,213 l0,-24 l-7,-9 l5,5 l2,4 l0,-12 l6,-8 l-4,5 l-2,5 z " +
  "M940,198 l0,-28 l-8,-10 l5,5 l3,5 l0,-14 l7,-9 l-4,6 l-3,5 z " +
  "M1130,188 l0,-24 l-7,-9 l5,5 l2,4 l0,-12 l6,-8 l-4,5 l-2,5 z " +
  "M1310,173 l0,-26 l-8,-10 l5,5 l3,5 l0,-14 l7,-9 l-4,6 l-3,5 z ";

/* ── Snow-capped trees for winter ── */
const SNOW_TREES_PATH =
  "M180,275 l-5,0 l5,-20 l5,20 z M175,270 l10,0 l-5,-3 z " +
  "M200,270 l-6,0 l6,-24 l6,24 z M194,264 l12,0 l-6,-3 z " +
  "M390,248 l-6,0 l6,-26 l6,26 z M384,242 l12,0 l-6,-3 z " +
  "M570,228 l-6,0 l6,-24 l6,24 z M564,222 l12,0 l-6,-3 z " +
  "M750,213 l-6,0 l6,-24 l6,24 z M744,207 l12,0 l-6,-3 z " +
  "M940,198 l-6,0 l6,-26 l6,26 z M934,192 l12,0 l-6,-3 z " +
  "M1130,188 l-6,0 l6,-24 l6,24 z M1124,182 l12,0 l-6,-3 z " +
  "M1310,173 l-6,0 l6,-26 l6,26 z M1304,167 l12,0 l-6,-3 z ";

/* ═══════════════════════════════════════════════════════════════════
   SEASON THEMES – colors, gradients, and config per season
   Each has dark & light variants
   ═══════════════════════════════════════════════════════════════════ */
const SEASONS = {
  /* ─────────────── 🌸  S P R I N G  ─────────────── */
  spring: {
    sky: {
      dark: "linear-gradient(180deg, #0a0c14 0%, #111525 25%, #1a1f35 50%, #222840 100%)",
      light: "linear-gradient(180deg, #e8dfe6 0%, #f0e8ef 25%, #f5eef2 55%, #faf5f6 100%)",
    },
    mountains: [
      { dark: "rgba(18,28,16,0.4)", light: "rgba(188,200,180,0.3)" },
      { dark: "rgba(14,22,12,0.6)", light: "rgba(175,192,168,0.4)" },
      { dark: "rgba(10,16,8,0.8)", light: "rgba(158,178,148,0.5)" },
    ],
    trees: { dark: "rgba(8,14,6,0.85)", light: "rgba(120,148,110,0.5)" },
    treesPath: TREES_PATH,
    celestial: {
      dark: {
        top: "8%", right: "15%", width: 50, height: 50,
        background: "radial-gradient(circle, rgba(220,225,240,0.15) 0%, rgba(200,210,235,0.05) 50%, transparent 72%)",
        boxShadow: "0 0 60px 30px rgba(200,210,235,0.03)",
      },
      light: {
        top: "6%", right: "18%", width: 80, height: 80,
        background: "radial-gradient(circle, rgba(255,230,210,0.3) 0%, rgba(255,220,195,0.1) 45%, transparent 72%)",
        boxShadow: "0 0 90px 45px rgba(255,225,200,0.05)",
      },
    },
    haze: {
      dark: "linear-gradient(180deg, transparent 0%, rgba(16,20,28,0.3) 100%)",
      light: "linear-gradient(180deg, transparent 0%, rgba(235,228,230,0.4) 100%)",
    },
    starColor: "220,225,245",
    starGlow: "200,210,240",
  },

  /* ─────────────── ☀️  S U M M E R  ─────────────── */
  summer: {
    sky: {
      dark: "linear-gradient(180deg, #080b06 0%, #0e120a 25%, #151a10 50%, #1a1d14 100%)",
      light: "linear-gradient(180deg, #e6e1d6 0%, #ede9df 25%, #f2efe6 55%, #f8f6f1 100%)",
    },
    mountains: [
      { dark: "rgba(16,20,12,0.4)", light: "rgba(195,190,178,0.3)" },
      { dark: "rgba(12,15,9,0.6)", light: "rgba(185,180,168,0.4)" },
      { dark: "rgba(8,10,6,0.8)", light: "rgba(170,165,152,0.5)" },
    ],
    trees: { dark: "rgba(6,8,4,0.85)", light: "rgba(155,150,138,0.5)" },
    treesPath: TREES_PATH,
    celestial: {
      dark: {
        top: "7%", right: "14%", width: 56, height: 56,
        background: "radial-gradient(circle, rgba(225,232,210,0.18) 0%, rgba(220,228,200,0.06) 50%, transparent 72%)",
        boxShadow: "0 0 70px 35px rgba(210,220,190,0.04)",
      },
      light: {
        top: "5%", right: "16%", width: 90, height: 90,
        background: "radial-gradient(circle, rgba(255,240,195,0.35) 0%, rgba(255,232,175,0.12) 45%, transparent 72%)",
        boxShadow: "0 0 100px 50px rgba(255,230,170,0.06)",
      },
    },
    haze: {
      dark: "linear-gradient(180deg, transparent 0%, rgba(18,22,14,0.3) 100%)",
      light: "linear-gradient(180deg, transparent 0%, rgba(235,230,218,0.4) 100%)",
    },
    starColor: "225,232,215",
    starGlow: "210,222,195",
  },

  /* ─────────────── 🍂  A U T U M N  ─────────────── */
  autumn: {
    sky: {
      dark: "linear-gradient(180deg, #0e0a06 0%, #151008 25%, #1d160c 50%, #241c10 100%)",
      light: "linear-gradient(180deg, #ede0cc 0%, #f2e6d4 25%, #f6eddf 55%, #faf5ec 100%)",
    },
    mountains: [
      { dark: "rgba(28,18,10,0.4)", light: "rgba(200,178,148,0.3)" },
      { dark: "rgba(22,14,8,0.6)", light: "rgba(192,165,130,0.4)" },
      { dark: "rgba(16,10,5,0.8)", light: "rgba(180,150,115,0.5)" },
    ],
    trees: { dark: "rgba(14,8,4,0.85)", light: "rgba(160,128,85,0.5)" },
    treesPath: BARE_TREES_PATH,
    celestial: {
      dark: {
        top: "9%", right: "13%", width: 60, height: 60,
        background: "radial-gradient(circle, rgba(245,210,160,0.16) 0%, rgba(240,200,140,0.05) 50%, transparent 72%)",
        boxShadow: "0 0 70px 35px rgba(240,200,140,0.04)",
      },
      light: {
        top: "8%", right: "14%", width: 85, height: 85,
        background: "radial-gradient(circle, rgba(255,210,140,0.3) 0%, rgba(255,195,120,0.1) 45%, transparent 72%)",
        boxShadow: "0 0 90px 45px rgba(255,200,130,0.05)",
      },
    },
    haze: {
      dark: "linear-gradient(180deg, transparent 0%, rgba(24,18,10,0.35) 100%)",
      light: "linear-gradient(180deg, transparent 0%, rgba(240,225,200,0.45) 100%)",
    },
    starColor: "240,225,200",
    starGlow: "235,215,180",
  },

  /* ─────────────── ❄️  W I N T E R  ─────────────── */
  winter: {
    sky: {
      dark: "linear-gradient(180deg, #060810 0%, #0a0e18 25%, #0f1420 50%, #141a28 100%)",
      light: "linear-gradient(180deg, #dce4ec 0%, #e4eaf0 25%, #ecf0f4 55%, #f4f6f8 100%)",
    },
    mountains: [
      { dark: "rgba(14,18,26,0.4)", light: "rgba(195,200,210,0.3)" },
      { dark: "rgba(10,14,22,0.6)", light: "rgba(185,192,205,0.4)" },
      { dark: "rgba(8,10,18,0.8)", light: "rgba(175,185,200,0.5)" },
    ],
    trees: { dark: "rgba(6,8,14,0.85)", light: "rgba(155,165,180,0.5)" },
    snowCaps: { dark: "rgba(180,195,220,0.25)", light: "rgba(255,255,255,0.45)" },
    treesPath: SNOW_TREES_PATH,
    celestial: {
      dark: {
        top: "6%", right: "16%", width: 48, height: 48,
        background: "radial-gradient(circle, rgba(200,215,240,0.2) 0%, rgba(185,200,230,0.07) 50%, transparent 72%)",
        boxShadow: "0 0 80px 40px rgba(185,200,230,0.05)",
      },
      light: {
        top: "7%", right: "18%", width: 70, height: 70,
        background: "radial-gradient(circle, rgba(240,245,255,0.3) 0%, rgba(225,235,250,0.1) 45%, transparent 72%)",
        boxShadow: "0 0 80px 40px rgba(230,240,255,0.05)",
      },
    },
    haze: {
      dark: "linear-gradient(180deg, transparent 0%, rgba(10,14,22,0.35) 100%)",
      light: "linear-gradient(180deg, transparent 0%, rgba(225,232,242,0.45) 100%)",
    },
    starColor: "200,215,240",
    starGlow: "185,200,230",
  },
};

/* ═══════════════════════════════════════════════════════════════════
   CANVAS ANIMATION HELPERS – one per season
   Each receives (ctx, w, h, t, frame, dark, particles) and draws
   onto the canvas for that frame.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Shared: stars (used by all dark modes) ── */
function drawStars(ctx, w, h, t, stars, colorRgb, glowRgb) {
  for (const s of stars) {
    const twinkle = 0.3 + 0.7 * ((Math.sin(t * s.speed + s.phase) + 1) / 2);
    const a = s.bright * twinkle;
    const sx = s.x * w;
    const sy = s.y * h;
    ctx.beginPath();
    ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${colorRgb},${a * 0.75})`;
    ctx.fill();
    if (s.r > 1.2) {
      ctx.beginPath();
      ctx.arc(sx, sy, s.r * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${glowRgb},${a * 0.07})`;
      ctx.fill();
    }
  }
}

/* ── Shared: shooting stars ── */
function updateMeteors(ctx, w, h, frame, meteors) {
  if (frame % 220 === 0 || (frame % 130 === 0 && Math.random() > 0.45)) {
    meteors.push({
      x: w * (0.1 + Math.random() * 0.65),
      y: h * Math.random() * 0.22,
      angle: Math.PI / 5 + Math.random() * Math.PI / 5,
      speed: 5 + Math.random() * 7,
      life: 1,
      decay: 0.011 + Math.random() * 0.009,
      len: 80 + Math.random() * 70,
    });
  }
  const alive = [];
  for (const m of meteors) {
    m.x += Math.cos(m.angle) * m.speed;
    m.y += Math.sin(m.angle) * m.speed;
    m.life -= m.decay;
    if (m.life <= 0) continue;
    const tx = m.x - Math.cos(m.angle) * m.len * m.life;
    const ty = m.y - Math.sin(m.angle) * m.len * m.life;
    const g = ctx.createLinearGradient(tx, ty, m.x, m.y);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(1, `rgba(255,255,255,${m.life * 0.6})`);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(m.x, m.y);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(m.x, m.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${m.life * 0.8})`;
    ctx.fill();
    alive.push(m);
  }
  meteors.length = 0;
  meteors.push(...alive);
}

/* ── Shared: sun rays ── */
function drawSunRays(ctx, w, h, t, color, alpha) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  for (let i = 0; i < 5; i++) {
    const angle = -0.3 + i * 0.15 + Math.sin(t * 0.08 + i) * 0.05;
    const ox = w * 0.82;
    const oy = h * 0.08;
    const len = h * 0.9;
    const spread = 0.06 + 0.02 * Math.sin(t * 0.15 + i * 1.2);
    const a = alpha + 0.008 * Math.sin(t * 0.1 + i * 0.8);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(angle - spread) * len, oy + Math.sin(angle - spread) * len);
    ctx.lineTo(ox + Math.cos(angle + spread) * len, oy + Math.sin(angle + spread) * len);
    ctx.closePath();
    const rg = ctx.createRadialGradient(ox, oy, 0, ox, oy, len);
    rg.addColorStop(0, `rgba(${color},${a * 2})`);
    rg.addColorStop(0.4, `rgba(${color},${a})`);
    rg.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = rg;
    ctx.fill();
  }
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════════
   🌸 SPRING  – cherry blossom petals + butterflies
   ═══════════════════════════════════════════════════════════════════ */
function initSpringParticles() {
  const petals = Array.from({ length: 55 }, () => ({
    x: Math.random(),
    y: Math.random() * 1.2 - 0.2,
    r: 2 + Math.random() * 4,
    vx: 0.00015 + Math.random() * 0.0003,
    vy: 0.0002 + Math.random() * 0.0004,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.03,
    sway: Math.random() * Math.PI * 2,
    swayAmp: 0.0002 + Math.random() * 0.0003,
    pink: Math.random() > 0.3,
  }));
  const butterflies = Array.from({ length: 4 }, () => ({
    x: Math.random(),
    y: 0.2 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    speed: 0.0002 + Math.random() * 0.0003,
    wingPhase: Math.random() * Math.PI * 2,
    color: Math.random() > 0.5 ? "210,170,220" : "180,210,160",
  }));
  return { petals, butterflies };
}

function drawSpring(ctx, w, h, t, dark, particles, seasonCfg) {
  if (dark) {
    drawSunRays(ctx, w, h, t, "200,185,220", 0.012);
  } else {
    drawSunRays(ctx, w, h, t, "255,215,190", 0.018);
  }

  /* Petals */
  for (const p of particles.petals) {
    p.x += p.vx + Math.sin(t * 0.5 + p.sway) * p.swayAmp;
    p.y += p.vy;
    p.rot += p.rotSpeed;
    if (p.y > 1.1) { p.y = -0.05; p.x = Math.random(); }
    if (p.x > 1.05) p.x = -0.05;

    const px = p.x * w;
    const py = p.y * h;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(p.rot);

    const baseAlpha = dark ? 0.35 : 0.55;
    const c = p.pink
      ? (dark ? `rgba(200,140,160,${baseAlpha})` : `rgba(235,170,190,${baseAlpha})`)
      : (dark ? `rgba(220,200,210,${baseAlpha})` : `rgba(255,235,240,${baseAlpha})`);

    ctx.beginPath();
    ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
    ctx.restore();
  }

  /* Butterflies */
  for (const b of particles.butterflies) {
    b.x += Math.sin(t * 0.3 + b.phase) * b.speed;
    b.y += Math.cos(t * 0.2 + b.phase * 1.5) * b.speed * 0.5;
    if (b.x > 1.05) b.x = -0.05;
    if (b.x < -0.05) b.x = 1.05;

    const bx = b.x * w;
    const by = b.y * h;
    const wing = Math.sin(t * 4 + b.wingPhase) * 0.4;
    const a = dark ? 0.3 : 0.5;

    ctx.save();
    ctx.translate(bx, by);
    /* left wing */
    ctx.beginPath();
    ctx.ellipse(-3, 0, 4, 2.5 + wing * 2, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${b.color},${a})`;
    ctx.fill();
    /* right wing */
    ctx.beginPath();
    ctx.ellipse(3, 0, 4, 2.5 + wing * 2, 0.3, 0, Math.PI * 2);
    ctx.fill();
    /* body */
    ctx.beginPath();
    ctx.ellipse(0, 0, 1, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(60,40,50,${a})`;
    ctx.fill();
    ctx.restore();
  }
}

/* ═══════════════════════════════════════════════════════════════════
   ☀️ SUMMER  – fireflies + warm dust motes + heat shimmer
   ═══════════════════════════════════════════════════════════════════ */
function initSummerParticles() {
  const fireflies = Array.from({ length: 45 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 1 + Math.random() * 2.5,
    vx: (Math.random() - 0.5) * 0.00025,
    vy: -0.00008 - Math.random() * 0.00015,
    pulse: 0.4 + Math.random() * 1.2,
    phase: Math.random() * Math.PI * 2,
    green: Math.random() > 0.35,
  }));
  return { fireflies };
}

function drawSummer(ctx, w, h, t, dark, particles, seasonCfg, frame, stars, meteors) {
  if (dark) {
    drawStars(ctx, w, h, t, stars, seasonCfg.starColor, seasonCfg.starGlow);

    /* Fireflies */
    for (const p of particles.fireflies) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -0.03) p.x = 1.03;
      if (p.x > 1.03) p.x = -0.03;
      if (p.y < -0.03) p.y = 1.03;

      const pulse = 0.2 + 0.8 * ((Math.sin(t * p.pulse + p.phase) + 1) / 2);
      const px = p.x * w;
      const py = p.y * h;
      const c = p.green ? "140,215,120" : "215,185,90";
      ctx.beginPath();
      ctx.arc(px, py, p.r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c},${pulse * 0.45})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, p.r * 4.5 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c},${pulse * 0.055})`;
      ctx.fill();
    }

    updateMeteors(ctx, w, h, frame, meteors);
  } else {
    drawSunRays(ctx, w, h, t, "255,230,170", 0.018);

    /* Warm dust motes */
    for (const p of particles.fireflies) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -0.03) p.x = 1.03;
      if (p.x > 1.03) p.x = -0.03;
      if (p.y < -0.03) p.y = 1.03;

      const pulse = 0.2 + 0.8 * ((Math.sin(t * p.pulse + p.phase) + 1) / 2);
      const px = p.x * w;
      const py = p.y * h;
      ctx.beginPath();
      ctx.arc(px, py, p.r * 0.6 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120,112,95,${pulse * 0.13})`;
      ctx.fill();
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════
   🍂 AUTUMN  – falling leaves + wind streaks
   ═══════════════════════════════════════════════════════════════════ */
function initAutumnParticles() {
  const LEAF_COLORS_DARK = [
    "180,100,40", "200,120,30", "160,80,30", "190,140,50", "170,60,30",
  ];
  const LEAF_COLORS_LIGHT = [
    "220,140,50", "240,160,40", "200,100,40", "230,170,60", "210,80,40",
  ];
  const leaves = Array.from({ length: 40 }, () => ({
    x: Math.random(),
    y: Math.random() * 1.3 - 0.3,
    r: 3 + Math.random() * 5,
    vx: 0.0002 + Math.random() * 0.0005,
    vy: 0.00015 + Math.random() * 0.0004,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.025,
    sway: Math.random() * Math.PI * 2,
    swayAmp: 0.0003 + Math.random() * 0.0005,
    tumble: Math.random() * Math.PI * 2,
    tumbleSpeed: 0.02 + Math.random() * 0.02,
    colorIdx: Math.floor(Math.random() * 5),
    darkColors: LEAF_COLORS_DARK,
    lightColors: LEAF_COLORS_LIGHT,
    shape: Math.random() > 0.5 ? "maple" : "oval",
  }));
  const windStreaks = Array.from({ length: 8 }, () => ({
    x: Math.random(),
    y: 0.3 + Math.random() * 0.5,
    len: 0.05 + Math.random() * 0.08,
    speed: 0.002 + Math.random() * 0.003,
    alpha: 0.03 + Math.random() * 0.04,
    phase: Math.random() * Math.PI * 2,
  }));
  return { leaves, windStreaks };
}

function drawAutumn(ctx, w, h, t, dark, particles, seasonCfg, frame, stars, meteors) {
  if (dark) {
    drawStars(ctx, w, h, t, stars, seasonCfg.starColor, seasonCfg.starGlow);
    updateMeteors(ctx, w, h, frame, meteors);
  } else {
    drawSunRays(ctx, w, h, t, "255,200,120", 0.02);
  }

  /* Wind streaks */
  for (const ws of particles.windStreaks) {
    ws.x += ws.speed;
    if (ws.x > 1.2) { ws.x = -0.1; ws.y = 0.3 + Math.random() * 0.5; }
    const wy = ws.y + Math.sin(t * 0.5 + ws.phase) * 0.02;
    const a = ws.alpha * (dark ? 0.5 : 1);
    ctx.beginPath();
    ctx.moveTo(ws.x * w, wy * h);
    ctx.lineTo((ws.x + ws.len) * w, (wy - 0.005) * h);
    ctx.strokeStyle = dark ? `rgba(180,150,120,${a})` : `rgba(200,170,130,${a})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /* Leaves */
  for (const lf of particles.leaves) {
    lf.x += lf.vx + Math.sin(t * 0.6 + lf.sway) * lf.swayAmp;
    lf.y += lf.vy;
    lf.rot += lf.rotSpeed;
    lf.tumble += lf.tumbleSpeed;
    if (lf.y > 1.15) { lf.y = -0.08; lf.x = Math.random(); }
    if (lf.x > 1.1) lf.x = -0.05;

    const lx = lf.x * w;
    const ly = lf.y * h;
    const colors = dark ? lf.darkColors : lf.lightColors;
    const c = colors[lf.colorIdx];
    const a = dark ? 0.4 : 0.65;
    const squash = 0.5 + 0.5 * Math.abs(Math.sin(lf.tumble));

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(lf.rot);

    if (lf.shape === "maple") {
      /* Simple maple-ish shape */
      ctx.beginPath();
      ctx.moveTo(0, -lf.r);
      ctx.lineTo(-lf.r * 0.7, -lf.r * 0.3);
      ctx.lineTo(-lf.r, 0);
      ctx.lineTo(-lf.r * 0.4, lf.r * 0.3);
      ctx.lineTo(0, lf.r * squash);
      ctx.lineTo(lf.r * 0.4, lf.r * 0.3);
      ctx.lineTo(lf.r, 0);
      ctx.lineTo(lf.r * 0.7, -lf.r * 0.3);
      ctx.closePath();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, lf.r * 0.5, lf.r * squash, 0, 0, Math.PI * 2);
    }
    ctx.fillStyle = `rgba(${c},${a})`;
    ctx.fill();
    ctx.restore();
  }
}

/* ═══════════════════════════════════════════════════════════════════
   ❄️ WINTER  – snowflakes + aurora borealis + frost sparkles
   ═══════════════════════════════════════════════════════════════════ */
function initWinterParticles() {
  const snowflakes = Array.from({ length: 70 }, () => ({
    x: Math.random(),
    y: Math.random() * 1.2 - 0.2,
    r: 1 + Math.random() * 3,
    vy: 0.0001 + Math.random() * 0.0003,
    sway: Math.random() * Math.PI * 2,
    swayAmp: 0.0001 + Math.random() * 0.0002,
    swaySpeed: 0.3 + Math.random() * 0.5,
    opacity: 0.3 + Math.random() * 0.7,
    sparkle: Math.random() > 0.7,
  }));
  const frost = Array.from({ length: 20 }, () => ({
    x: Math.random(),
    y: Math.random(),
    phase: Math.random() * Math.PI * 2,
    r: 0.5 + Math.random() * 1.5,
  }));
  return { snowflakes, frost };
}

function drawWinterAurora(ctx, w, h, t) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const bands = [
    { r: 75, g: 185, b: 110, base: 0.10, amp: 0.055 },
    { r: 55, g: 145, b: 195, base: 0.17, amp: 0.04 },
    { r: 125, g: 85, b: 175, base: 0.23, amp: 0.03 },
  ];
  for (let bi = 0; bi < bands.length; bi++) {
    const b = bands[bi];
    const pulse = 0.035 + 0.02 * Math.sin(t * 0.12 + bi * 1.3);
    ctx.beginPath();
    ctx.moveTo(0, h * b.base);
    for (let x = 0; x <= w; x += 4) {
      const nx = x / w;
      const y =
        h * b.base +
        Math.sin(nx * 4.5 + t * 0.22 + bi * 2) * h * b.amp +
        Math.sin(nx * 7.5 - t * 0.14 + bi) * h * b.amp * 0.5 +
        Math.sin(nx * 2.2 + t * 0.09) * h * b.amp * 0.7;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h * 0.48);
    ctx.lineTo(0, h * 0.48);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, h * b.base * 0.8, 0, h * 0.48);
    grad.addColorStop(0, `rgba(${b.r},${b.g},${b.b},${pulse * 0.4})`);
    grad.addColorStop(0.35, `rgba(${b.r},${b.g},${b.b},${pulse})`);
    grad.addColorStop(1, `rgba(${b.r},${b.g},${b.b},0)`);
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.restore();
}

function drawWinter(ctx, w, h, t, dark, particles, seasonCfg, frame, stars, meteors) {
  if (dark) {
    drawStars(ctx, w, h, t, stars, seasonCfg.starColor, seasonCfg.starGlow);
    drawWinterAurora(ctx, w, h, t);
    updateMeteors(ctx, w, h, frame, meteors);
  } else {
    drawSunRays(ctx, w, h, t, "220,230,245", 0.014);
  }

  /* Snowflakes */
  for (const sf of particles.snowflakes) {
    sf.x += Math.sin(t * sf.swaySpeed + sf.sway) * sf.swayAmp;
    sf.y += sf.vy;
    if (sf.y > 1.1) { sf.y = -0.05; sf.x = Math.random(); }

    const sx = sf.x * w;
    const sy = sf.y * h;
    const a = sf.opacity * (dark ? 0.5 : 0.7);

    ctx.beginPath();
    ctx.arc(sx, sy, sf.r, 0, Math.PI * 2);
    ctx.fillStyle = dark
      ? `rgba(200,215,240,${a})`
      : `rgba(255,255,255,${a})`;
    ctx.fill();

    /* sparkle halo on some flakes */
    if (sf.sparkle) {
      const sparkA = 0.15 * ((Math.sin(t * 2 + sf.sway) + 1) / 2);
      ctx.beginPath();
      ctx.arc(sx, sy, sf.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = dark
        ? `rgba(180,200,230,${sparkA * 0.4})`
        : `rgba(255,255,255,${sparkA * 0.6})`;
      ctx.fill();
    }
  }

  /* Frost sparkles – tiny glints */
  if (dark) {
    for (const fr of particles.frost) {
      const glint = Math.max(0, Math.sin(t * 1.5 + fr.phase));
      if (glint < 0.7) continue;
      const fx = fr.x * w;
      const fy = fr.y * h;
      const a = (glint - 0.7) / 0.3 * 0.3;
      ctx.beginPath();
      ctx.arc(fx, fy, fr.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,245,${a})`;
      ctx.fill();
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const mtRefs = useRef([]);
  const scrollRef = useRef(0);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const themeRef = useRef(isDark);
  themeRef.current = isDark;

  const season = useMemo(() => getSeason(), []);
  const seasonCfg = SEASONS[season];
  const seasonRef = useRef(season);
  seasonRef.current = season;
  const cfgRef = useRef(seasonCfg);
  cfgRef.current = seasonCfg;

  /* ── scroll listener ── */
  useEffect(() => {
    const h = () => { scrollRef.current = window.scrollY; };
    window.addEventListener("scroll", h, { passive: true });
    h();
    return () => window.removeEventListener("scroll", h);
  }, []);

  /* ── mountain parallax loop ── */
  useEffect(() => {
    let raf;
    const tick = () => {
      const sy = scrollRef.current;
      mtRefs.current.forEach((el, i) => {
        if (!el) return;
        el.style.transform = `translateY(${-sy * MOUNTAIN_PATHS[i].parallax}px)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── canvas animation ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let frame = 0;

    /* Shared stars (all seasons use in dark mode) */
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.6,
      r: 0.3 + Math.random() * 2,
      speed: 0.3 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      bright: 0.3 + Math.random() * 0.7,
    }));
    const meteors = [];

    /* Season-specific particles */
    const springP = initSpringParticles();
    const summerP = initSummerParticles();
    const autumnP = initAutumnParticles();
    const winterP = initWinterParticles();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      const { width: w, height: h } = canvas;
      const dark = themeRef.current;
      const t = frame * 0.016;
      const s = seasonRef.current;
      const cfg = cfgRef.current;
      frame++;

      ctx.clearRect(0, 0, w, h);

      switch (s) {
        case "spring":
          if (dark) drawStars(ctx, w, h, t, stars, cfg.starColor, cfg.starGlow);
          drawSpring(ctx, w, h, t, dark, springP, cfg);
          break;
        case "summer":
          drawSummer(ctx, w, h, t, dark, summerP, cfg, frame, stars, meteors);
          break;
        case "autumn":
          drawAutumn(ctx, w, h, t, dark, autumnP, cfg, frame, stars, meteors);
          break;
        case "winter":
          drawWinter(ctx, w, h, t, dark, winterP, cfg, frame, stars, meteors);
          break;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Sky gradient */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{ background: isDark ? seasonCfg.sky.dark : seasonCfg.sky.light }}
      />

      {/* Celestial body */}
      <div
        className="absolute rounded-full transition-all duration-700"
        style={isDark ? seasonCfg.celestial.dark : seasonCfg.celestial.light}
      />

      {/* Horizon haze */}
      <div
        className="absolute left-0 right-0 transition-opacity duration-700"
        style={{
          bottom: "15%",
          height: "20%",
          background: isDark ? seasonCfg.haze.dark : seasonCfg.haze.light,
        }}
      />

      {/* Mountain layers (SVG + parallax) */}
      {MOUNTAIN_PATHS.map((mt, i) => (
        <svg
          key={`mt-${i}`}
          ref={(el) => (mtRefs.current[i] = el)}
          className="absolute bottom-0 left-0 w-full will-change-transform"
          style={{ height: mt.height }}
          viewBox="0 0 1440 400"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={mt.d}
            fill={isDark ? seasonCfg.mountains[i].dark : seasonCfg.mountains[i].light}
            className="transition-colors duration-700"
          />
          {/* Trees on front mountain */}
          {i === 2 && (
            <path
              d={seasonCfg.treesPath}
              fill={isDark ? seasonCfg.trees.dark : seasonCfg.trees.light}
              className="transition-colors duration-700"
            />
          )}
          {/* Winter snow caps on trees */}
          {i === 2 && season === "winter" && seasonCfg.snowCaps && (
            <path
              d={SNOW_TREES_PATH}
              fill={isDark ? seasonCfg.snowCaps.dark : seasonCfg.snowCaps.light}
              className="transition-colors duration-700"
              style={{ transform: "translateY(-2px)" }}
            />
          )}
        </svg>
      ))}

      {/* Canvas layer for all dynamic elements */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Noise texture */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isDark ? 0.03 : 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}
