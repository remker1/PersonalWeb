import { useEffect, useRef, useState } from "react";
import { useT, useDocTitle } from "./testersUtils";

const BUTTONS = [
  { id: 0, key: "msLeft" },
  { id: 2, key: "msRight" },
];

export default function TrackpadTester() {
  const t = useT();
  useDocTitle(t("mouse"));

  const [held, setHeld] = useState(() => new Set());
  const [tested, setTested] = useState(() => new Set());
  const [dblInterval, setDblInterval] = useState(null);
  const [dblCount, setDblCount] = useState(0);
  const [wheel, setWheel] = useState({ up: 0, down: 0, left: 0, right: 0 });
  const [pinch, setPinch] = useState({ in: 0, out: 0 });
  const [hz, setHz] = useState(0);
  const [maxHz, setMaxHz] = useState(0);

  const lastClickRef = useRef(0);
  const canvasRef = useRef(null);
  const areaRef = useRef(null);
  const lastPosRef = useRef(null);
  const rateRef = useRef({ count: 0, start: 0 });

  const onButtonDown = (e) => {
    e.preventDefault();
    setHeld((prev) => new Set(prev).add(e.button));
    setTested((prev) => new Set(prev).add(e.button));
  };
  const onButtonUp = (e) => {
    e.preventDefault();
    setHeld((prev) => {
      const next = new Set(prev);
      next.delete(e.button);
      return next;
    });
  };

  const onDblArea = () => {
    const now = performance.now();
    if (lastClickRef.current && now - lastClickRef.current < 800) {
      setDblInterval(Math.round(now - lastClickRef.current));
    }
    lastClickRef.current = now;
  };

  // wheel: non-passive listener so testing doesn't scroll the page
  const wheelRef = useRef(null);
  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey) {
        setPinch((value) => ({
          in: value.in + (e.deltaY > 0 ? 1 : 0),
          out: value.out + (e.deltaY < 0 ? 1 : 0),
        }));
        return;
      }
      setWheel((w) => ({
        up: w.up + (e.deltaY < 0 ? 1 : 0),
        down: w.down + (e.deltaY > 0 ? 1 : 0),
        left: w.left + (e.deltaX < 0 ? 1 : 0),
        right: w.right + (e.deltaX > 0 ? 1 : 0),
      }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // trail drawing + polling-rate measurement (coalesced events = true HW rate)
  const onAreaMove = (e) => {
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];

    const now = performance.now();
    const rate = rateRef.current;
    if (!rate.start || now - rate.start > 1000) {
      if (rate.start) {
        const measured = Math.round((rate.count * 1000) / (now - rate.start));
        setHz(measured);
        setMaxHz((m) => Math.max(m, measured));
      }
      rate.start = now;
      rate.count = 0;
    }
    rate.count += events.length;

    const canvas = canvasRef.current;
    const area = areaRef.current;
    if (!canvas || !area) return;
    const box = area.getBoundingClientRect();
    if (canvas.width !== Math.round(box.width)) {
      canvas.width = Math.round(box.width);
      canvas.height = Math.round(box.height);
    }
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let last = lastPosRef.current;
    for (const ev of events) {
      const x = ev.clientX - box.left;
      const y = ev.clientY - box.top;
      if (last) {
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(x, y);
      }
      last = { x, y };
    }
    lastPosRef.current = last;
    ctx.stroke();
  };

  const clearTrail = () => {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    lastPosRef.current = null;
    setHz(0);
    setMaxHz(0);
    rateRef.current = { count: 0, start: 0 };
  };

  const reset = () => {
    setHeld(new Set());
    setTested(new Set());
    setDblInterval(null);
    setDblCount(0);
    setWheel({ up: 0, down: 0, left: 0, right: 0 });
    setPinch({ in: 0, out: 0 });
    clearTrail();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold mr-auto">🖐️ {t("mouse")}</h1>
        <button
          onClick={reset}
          className="px-3 py-1.5 rounded-full text-sm border border-border text-text-secondary hover:bg-bg-secondary transition-colors"
        >
          {t("kbReset")}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div
          className="rounded-2xl border border-border bg-bg-card p-5 select-none"
          onPointerDown={onButtonDown}
          onPointerUp={onButtonUp}
          onContextMenu={(e) => e.preventDefault()}
          onAuxClick={(e) => e.preventDefault()}
        >
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-1">
            {t("msButtons")}
          </h2>
          <p className="text-xs text-text-muted mb-4">{t("msButtonsHint")}</p>
          <div className="flex flex-wrap gap-2">
            {BUTTONS.map((b) => (
              <div
                key={b.id}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  held.has(b.id)
                    ? "border-accent bg-accent text-bg-primary"
                    : tested.has(b.id)
                      ? "border-accent/60 bg-accent/20"
                      : "border-border bg-bg-secondary text-text-secondary"
                }`}
              >
                {t(b.key)}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-bg-card p-5">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-1">
            {t("msDbl")}
          </h2>
          <p className="text-xs text-text-muted mb-4">{t("msDblHint")}</p>
          <div
            onClick={onDblArea}
            onDoubleClick={() => setDblCount((c) => c + 1)}
            className="rounded-xl border-2 border-dashed border-border h-24 flex items-center justify-center cursor-pointer hover:border-accent/60 transition-colors select-none"
          >
            <div className="text-center">
              <div className="font-mono text-lg tabular-nums">
                {dblInterval != null ? `${dblInterval} ms` : "—"}
              </div>
              <div className="text-xs text-text-muted mt-1">
                {t("msDblCount")}: {dblCount}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-bg-card p-5">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-1">
            {t("msWheel")}
          </h2>
          <p className="text-xs text-text-muted mb-4">{t("msWheelHint")}</p>
          <div
            ref={wheelRef}
            className="rounded-xl border-2 border-dashed border-border min-h-24 grid grid-cols-3 sm:grid-cols-6 items-center text-center select-none"
          >
            {[
              ["↑", wheel.up],
              ["↓", wheel.down],
              ["←", wheel.left],
              ["→", wheel.right],
              ["−", pinch.in, t("tpPinchIn")],
              ["+", pinch.out, t("tpPinchOut")],
            ].map(([arrow, count, label]) => (
              <div key={`${arrow}-${label || "scroll"}`} className="py-3">
                <div className={`text-xl ${count > 0 ? "text-accent" : "text-text-muted"}`}>
                  {arrow}
                </div>
                <div className="font-mono text-sm tabular-nums">{count}</div>
                {label && <div className="text-[10px] text-text-muted mt-0.5">{label}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-bg-card p-5">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
              {t("msMove")}
            </h2>
            <div className="text-xs text-text-muted font-mono tabular-nums">
              {hz} Hz · {t("msMaxRate")} {maxHz} Hz
            </div>
          </div>
          <p className="text-xs text-text-muted mb-4">{t("msMoveHint")}</p>
          <div
            ref={areaRef}
            onPointerMove={onAreaMove}
            onPointerLeave={() => (lastPosRef.current = null)}
            className="relative rounded-xl border-2 border-dashed border-border h-24 overflow-hidden cursor-crosshair"
          >
            <canvas ref={canvasRef} className="absolute inset-0" />
          </div>
        </div>
      </div>
      <p className="text-xs text-text-muted mt-6">💡 {t("tpDisclaimer")}</p>
    </div>
  );
}
