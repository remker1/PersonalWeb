import { useEffect, useRef, useState } from "react";
import { useT, useDocTitle } from "./testersUtils";

const FILLS = [
  { name: "White", css: "#ffffff" },
  { name: "Black", css: "#000000" },
  { name: "Red", css: "#ff0000" },
  { name: "Green", css: "#00ff00" },
  { name: "Blue", css: "#0000ff" },
  { name: "Gray", css: "#808080" },
  { name: "Gradient", css: "linear-gradient(to right, #000, #fff)" },
];

// live refresh-rate measurement from rAF frame intervals (median of a window)
function useRefreshRate() {
  const [hz, setHz] = useState(null);
  useEffect(() => {
    let raf;
    let last = null;
    let intervals = [];
    const tick = (now) => {
      if (last != null) {
        const dt = now - last;
        if (dt > 2 && dt < 100) intervals.push(dt);
        if (intervals.length >= 50) {
          const sorted = [...intervals].sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          setHz(Math.round(1000 / median));
          intervals = [];
        }
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return hz;
}

export default function ScreenTester() {
  const t = useT();
  useDocTitle(t("screen"));

  const hz = useRefreshRate();
  const [fillIdx, setFillIdx] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const overlayRef = useRef(null);

  const dpr = window.devicePixelRatio || 1;
  const physW = Math.round(window.screen.width * dpr);
  const physH = Math.round(window.screen.height * dpr);

  const startTest = (idx) => {
    setFillIdx(idx);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);
  };

  // enter fullscreen when the overlay mounts; leave test when fullscreen exits
  useEffect(() => {
    if (fillIdx == null) return;
    const el = overlayRef.current;
    el?.requestFullscreen?.().catch(() => {});
    const onFsChange = () => {
      if (!document.fullscreenElement) setFillIdx(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setFillIdx(null); // fallback when fullscreen was denied
    };
    document.addEventListener("fullscreenchange", onFsChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      window.removeEventListener("keydown", onKey);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [fillIdx != null]); // eslint-disable-line react-hooks/exhaustive-deps

  const cycle = () => {
    setFillIdx((i) => (i + 1) % FILLS.length);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 1500);
  };

  const stats = [
    [t("scResolution"), `${physW} × ${physH}`],
    [t("scViewport"), `${window.innerWidth} × ${window.innerHeight}`],
    [t("scDpr"), `${dpr}×`],
    [t("scColorDepth"), `${window.screen.colorDepth}-bit`],
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🖥️ {t("screen")}</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-bg-card px-4 py-3">
            <div className="text-xs text-text-muted">{label}</div>
            <div className="text-sm font-medium tabular-nums">{value}</div>
          </div>
        ))}
        <div className="rounded-xl border border-border bg-bg-card px-4 py-3">
          <div className="text-xs text-text-muted">{t("scRefresh")}</div>
          <div className="text-sm font-medium tabular-nums">
            {hz != null ? `${hz} Hz` : "…"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-5">
        <h2 className="text-lg font-semibold">{t("scDeadPixel")}</h2>
        <p className="text-sm text-text-muted mt-1">{t("scDeadPixelDesc")}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {FILLS.map((fill, i) => (
            <button
              key={fill.name}
              onClick={() => startTest(i)}
              className="w-16 h-10 rounded-lg border border-border hover:scale-105 transition-transform"
              style={{ background: fill.css }}
              title={fill.name}
              aria-label={fill.name}
            />
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3">💡 {t("scExitHint")}</p>
      </div>

      {fillIdx != null && (
        <div
          ref={overlayRef}
          onClick={cycle}
          className="fixed inset-0 z-[100] cursor-pointer"
          style={{ background: FILLS[fillIdx].css }}
        >
          {showHint && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/70 text-white text-sm">
              {t("scOverlayHint")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
