import { useRef, useState } from "react";
import { useT, useDocTitle } from "./testersUtils";

const COLORS = ["#e6553f", "#4f7ae0", "#4fae57", "#c98a2b", "#9a5fd0", "#2ba8b8", "#d05f8e", "#7a8a3a"];

export default function TouchTester() {
  const t = useT();
  useDocTitle(t("touch"));

  const [touches, setTouches] = useState(() => new Map());
  const [maxTouches, setMaxTouches] = useState(0);
  const areaRef = useRef(null);

  const hasTouch = typeof navigator !== "undefined" && (navigator.maxTouchPoints > 0 || "ontouchstart" in window);

  const toLocal = (e) => {
    const box = areaRef.current.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top, pressure: e.pressure };
  };

  const onDown = (e) => {
    if (e.pointerType === "mouse") return;
    try {
      areaRef.current.setPointerCapture(e.pointerId);
    } catch { /* synthetic or already-released pointer */ }
    setTouches((prev) => {
      const next = new Map(prev).set(e.pointerId, toLocal(e));
      setMaxTouches((m) => Math.max(m, next.size));
      return next;
    });
  };
  const onMove = (e) => {
    if (e.pointerType === "mouse") return;
    setTouches((prev) => (prev.has(e.pointerId) ? new Map(prev).set(e.pointerId, toLocal(e)) : prev));
  };
  const onEnd = (e) => {
    setTouches((prev) => {
      if (!prev.has(e.pointerId)) return prev;
      const next = new Map(prev);
      next.delete(e.pointerId);
      return next;
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold mr-auto">👆 {t("touch")}</h1>
        <div className="text-sm text-text-secondary tabular-nums">
          {t("tcActive")}: <span className="text-accent font-semibold">{touches.size}</span>
          {" · "}
          {t("tcMax")}: <span className="text-accent font-semibold">{maxTouches}</span>
        </div>
        <button
          onClick={() => setMaxTouches(0)}
          className="px-3 py-1.5 rounded-full text-sm border border-border text-text-secondary hover:bg-bg-secondary transition-colors"
        >
          {t("kbReset")}
        </button>
      </div>

      {!hasTouch && (
        <p className="text-sm text-text-muted mb-4">ℹ️ {t("tcNoTouch")}</p>
      )}

      <div
        ref={areaRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onEnd}
        onPointerCancel={onEnd}
        className="relative rounded-2xl border-2 border-dashed border-border bg-bg-secondary/50 h-[60vh] overflow-hidden select-none"
        style={{ touchAction: "none" }}
      >
        {touches.size === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-text-muted px-8 text-center pointer-events-none">
            {t("tcHint")}
          </p>
        )}
        {[...touches.entries()].map(([id, p], i) => (
          <div
            key={id}
            className="absolute pointer-events-none"
            style={{ left: p.x, top: p.y, transform: "translate(-50%, -50%)" }}
          >
            <div
              className="rounded-full border-4 flex items-center justify-center text-white font-bold"
              style={{
                width: 88,
                height: 88,
                borderColor: COLORS[i % COLORS.length],
                background: `${COLORS[i % COLORS.length]}55`,
              }}
            >
              {i + 1}
            </div>
            <div className="mt-1 text-center font-mono text-[10px] text-text-muted">
              {Math.round(p.x)}, {Math.round(p.y)}
              {p.pressure > 0 && p.pressure !== 0.5 ? ` · ${p.pressure.toFixed(2)}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
