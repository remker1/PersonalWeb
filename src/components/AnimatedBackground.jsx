import { useEffect, useRef, useCallback } from "react";
import { useTheme } from "../contexts/ThemeContext";

const CLOUD_SHAPES = [
  "M25,60 Q10,60 10,48 Q10,36 22,34 Q20,20 36,18 Q50,10 65,20 Q72,12 88,14 Q100,8 112,18 Q130,10 142,22 Q160,14 168,28 Q185,24 188,40 Q195,40 195,50 Q195,62 180,62 Z",
  "M20,65 Q5,65 8,50 Q8,38 20,36 Q18,22 35,16 Q48,6 62,14 Q70,4 85,10 Q98,4 110,14 Q120,8 132,16 Q145,10 155,24 Q170,18 175,34 Q190,32 190,48 Q192,62 178,65 Z",
  "M30,55 Q18,55 20,44 Q20,34 32,30 Q30,18 48,16 Q60,10 75,18 Q85,12 98,16 Q110,12 120,22 Q135,20 138,34 Q148,34 148,44 Q150,56 135,55 Z",
  "M15,58 Q5,58 8,48 Q8,38 18,36 Q16,28 30,24 Q42,18 58,22 Q68,16 82,20 Q95,14 110,20 Q125,16 140,24 Q155,18 165,28 Q178,24 182,36 Q192,34 192,46 Q195,58 180,58 Z",
];

const CLOUD_CONFIGS = [
  { shape: 0, x: -5,  y: 15,  scale: 1.3,  opacity: 0.14, speed: 0.15, flip: false, hoverAmp: 1.2, phase: 0 },
  { shape: 1, x: 60,  y: 25,  scale: 1.0,  opacity: 0.10, speed: 0.10, flip: true,  hoverAmp: 0.9, phase: 1.5 },
  { shape: 2, x: 25,  y: 45,  scale: 0.7,  opacity: 0.09, speed: 0.20, flip: false, hoverAmp: 1.4, phase: 0.8 },
  { shape: 3, x: 75,  y: 55,  scale: 1.1,  opacity: 0.12, speed: 0.12, flip: true,  hoverAmp: 1.0, phase: 2.2 },
  { shape: 0, x: 40,  y: 70,  scale: 0.9,  opacity: 0.10, speed: 0.18, flip: false, hoverAmp: 1.3, phase: 0.3 },
  { shape: 2, x: 85,  y: 35,  scale: 0.8,  opacity: 0.09, speed: 0.22, flip: true,  hoverAmp: 1.5, phase: 1.8 },
  { shape: 1, x: 10,  y: 80,  scale: 1.2,  opacity: 0.12, speed: 0.14, flip: false, hoverAmp: 1.1, phase: 2.5 },
  { shape: 3, x: 50,  y: 10,  scale: 0.6,  opacity: 0.07, speed: 0.25, flip: true,  hoverAmp: 1.6, phase: 0.6 },
  { shape: 0, x: 30,  y: 90,  scale: 1.0,  opacity: 0.10, speed: 0.16, flip: false, hoverAmp: 1.0, phase: 1.2 },
  { shape: 2, x: 70,  y: 65,  scale: 0.85, opacity: 0.09, speed: 0.20, flip: true,  hoverAmp: 1.25, phase: 2.8 },
  // More clouds for fuller sky when scrolling
  { shape: 1, x: 20,  y: 5,   scale: 0.65, opacity: 0.08, speed: 0.18, flip: false, hoverAmp: 1.3, phase: 0.4 },
  { shape: 0, x: 55,  y: 38,  scale: 0.75, opacity: 0.09, speed: 0.14, flip: true,  hoverAmp: 1.1, phase: 1.9 },
  { shape: 3, x: 90,  y: 72,  scale: 0.95, opacity: 0.11, speed: 0.21, flip: false, hoverAmp: 1.4, phase: 2.1 },
  { shape: 2, x: 5,   y: 52,  scale: 0.8,  opacity: 0.10, speed: 0.16, flip: true,  hoverAmp: 0.95, phase: 0.9 },
  { shape: 0, x: 65,  y: 85,  scale: 1.15, opacity: 0.11, speed: 0.19, flip: false, hoverAmp: 1.35, phase: 2.4 },
  { shape: 1, x: 35,  y: 22,  scale: 0.7,  opacity: 0.08, speed: 0.23, flip: true,  hoverAmp: 1.5, phase: 1.1 },
  { shape: 3, x: 78,  y: 48,  scale: 0.88, opacity: 0.10, speed: 0.17, flip: false, hoverAmp: 1.2, phase: 0.2 },
  { shape: 2, x: 15,  y: 62,  scale: 0.72, opacity: 0.09, speed: 0.20, flip: true,  hoverAmp: 1.45, phase: 2.6 },
  { shape: 0, x: 45,  y: 95,  scale: 1.05, opacity: 0.10, speed: 0.15, flip: false, hoverAmp: 1.0, phase: 1.6 },
  { shape: 1, x: 95,  y: 18,  scale: 0.6,  opacity: 0.07, speed: 0.24, flip: true,  hoverAmp: 1.6, phase: 0.7 },
];

export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const cloudsRef = useRef([]);
  const scrollRef = useRef(0);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const themeRef = useRef(isDark);
  themeRef.current = isDark;

  const createFirework = useCallback((width, height) => {
    const palettes = [
      ["#88b38f", "#a1c6a8", "#4f7a57", "#c8dcc9"],
      ["#e8a87c", "#d27d5c", "#f0c27a", "#e8d5b7"],
      ["#7eb8c9", "#5a9aab", "#a3d4e0", "#c4e3eb"],
      ["#c9a0dc", "#a675bf", "#dfc4ed", "#e8d8f0"],
      ["#e8c170", "#d4a843", "#f0d890", "#f5e6b8"],
    ];
    const palette = palettes[Math.floor(Math.random() * palettes.length)];
    const x = width * (0.1 + Math.random() * 0.8);
    const launchY = height;
    const targetY = height * (0.1 + Math.random() * 0.4);
    const particleCount = 30 + Math.floor(Math.random() * 30);

    return {
      x,
      y: launchY,
      targetY,
      vy: -(4 + Math.random() * 3),
      phase: "launch",
      trail: [],
      palette,
      particles: Array.from({ length: particleCount }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3.5;
        return {
          x: 0,
          y: 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.008 + Math.random() * 0.012,
          color: palette[Math.floor(Math.random() * palette.length)],
          size: 1.5 + Math.random() * 2,
          sparkle: Math.random() > 0.6,
        };
      }),
      burstX: 0,
      burstY: 0,
    };
  }, []);

  // Scroll-driven parallax: store scroll position for the cloud loop
  useEffect(() => {
    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Continuous cloud animation: hover + scroll parallax (scroll down → clouds move up)
  useEffect(() => {
    let rafId;
    const startTime = Date.now();

    const updateClouds = () => {
      const sy = scrollRef.current;
      const t = (Date.now() - startTime) / 1000;

      cloudsRef.current.forEach((el, i) => {
        if (!el) return;
        const c = CLOUD_CONFIGS[i];
        // Parallax: scroll down → clouds move up (negative y)
        const depthBoost = 0.35 + c.speed * 1.35;
        const yOffset = -sy * depthBoost;
        const xOffset = sy * c.speed * 0.12 * (c.flip ? -1 : 1);
        const dynamicScale = c.scale * (1 + (sy / 6000) * 0.04);
        // Hover: gentle floating motion (different phase per cloud)
        const hoverY = Math.sin(t * 0.4 * c.speed + c.phase * Math.PI) * (4 * c.hoverAmp);
        const hoverX = Math.cos(t * 0.35 * c.speed + c.phase * Math.PI) * (2 * c.hoverAmp);
        el.style.transform =
          `translate(-50%, 0) translate(${xOffset + hoverX}px, ${yOffset + hoverY}px) scale(${dynamicScale}) ${c.flip ? "scaleX(-1)" : ""}`;
      });

      rafId = requestAnimationFrame(updateClouds);
    };

    rafId = requestAnimationFrame(updateClouds);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Fireworks canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let fireworks = [];
    let timer = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      const { width, height } = canvas;
      const dark = themeRef.current;

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width, height);

      timer++;
      if (timer % 90 === 0 || (timer % 55 === 0 && Math.random() > 0.4)) {
        fireworks.push(createFirework(width, height));
      }

      ctx.globalCompositeOperation = dark ? "lighter" : "source-over";

      fireworks = fireworks.filter((fw) => {
        if (fw.phase === "launch") {
          fw.y += fw.vy;
          fw.trail.push({ x: fw.x, y: fw.y, alpha: 1 });
          if (fw.trail.length > 12) fw.trail.shift();

          for (let i = 0; i < fw.trail.length; i++) {
            const t = fw.trail[i];
            t.alpha -= 0.08;
            if (t.alpha <= 0) continue;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = dark
              ? `rgba(200, 210, 190, ${t.alpha * 0.6})`
              : `rgba(100, 120, 90, ${t.alpha * 0.4})`;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(fw.x, fw.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = dark
            ? "rgba(220, 230, 210, 0.8)"
            : "rgba(80, 100, 70, 0.6)";
          ctx.fill();

          if (fw.y <= fw.targetY) {
            fw.phase = "burst";
            fw.burstX = fw.x;
            fw.burstY = fw.y;
            fw.trail = [];
          }
          return true;
        }

        if (fw.phase === "burst") {
          let alive = false;
          for (const p of fw.particles) {
            if (p.life <= 0) continue;
            alive = true;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.03;
            p.vx *= 0.99;
            p.life -= p.decay;

            const alpha = Math.max(0, p.life);
            const drawX = fw.burstX + p.x;
            const drawY = fw.burstY + p.y;

            if (p.sparkle && Math.random() > 0.5) {
              ctx.beginPath();
              ctx.arc(drawX, drawY, p.size * 0.6, 0, Math.PI * 2);
              ctx.fillStyle = dark
                ? `rgba(255, 255, 255, ${alpha * 0.4})`
                : `rgba(255, 255, 255, ${alpha * 0.3})`;
              ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(drawX, drawY, p.size * alpha, 0, Math.PI * 2);
            const opacity = dark ? alpha * 0.7 : alpha * 0.5;
            ctx.fillStyle = hexToRgba(p.color, opacity);
            ctx.fill();
          }
          return alive;
        }

        return false;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [createFirework]);

  const cloudColor = isDark ? "#3a4232" : "#c8c0b0";
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Layer 1: Base gradient */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 120% 100% at 50% 0%, #1a1d14 0%, #12130f 100%)"
            : "radial-gradient(ellipse 120% 100% at 50% 0%, #f8f6f1 0%, #efebe2 100%)",
        }}
      />

      {/* Layer 2: Parallax clouds */}
      <div className="absolute inset-0 overflow-hidden">
        {CLOUD_CONFIGS.map((config, i) => (
          <svg
            key={i}
            ref={(el) => (cloudsRef.current[i] = el)}
            viewBox="0 0 200 80"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute will-change-transform"
            style={{
              left: `${config.x}%`,
              top: `${config.y}%`,
              width: `${config.scale * 18}vw`,
              minWidth: "120px",
              transform: `translate(-50%, 0) scale(${config.scale}) ${config.flip ? "scaleX(-1)" : ""}`,
              opacity: config.opacity,
              transition: "fill 0.5s ease",
            }}
          >
            <path d={CLOUD_SHAPES[config.shape]} fill={cloudColor} />
          </svg>
        ))}
      </div>

      {/* Layer 3: Fireworks canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: isDark ? 0.85 : 0.6 }}
      />

      <div
        className="absolute inset-0"
        style={{
          opacity: isDark ? 0.025 : 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
