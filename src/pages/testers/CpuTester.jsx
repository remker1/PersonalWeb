import { useEffect, useRef, useState } from "react";
import { useT, useDocTitle } from "./testersUtils";

// fixed work unit (~5 ms on a modern core): prime sieve + integer hashing
const WORKER_SRC = `
function unit() {
  let acc = 0;
  for (let i = 2; i < 6000; i++) {
    let p = true;
    for (let j = 2; j * j <= i; j++) if (i % j === 0) { p = false; break; }
    if (p) acc += Math.sqrt(i) * Math.sin(i);
  }
  let h = 2166136261;
  for (let i = 0; i < 40000; i++) { h ^= i; h = Math.imul(h, 16777619); }
  return acc + (h >>> 0);
}
let sink = 0;
onmessage = (e) => {
  const { duration, report } = e.data;
  const t0 = performance.now();
  let units = 0;
  let lastReport = t0;
  for (;;) {
    sink += unit();
    units++;
    const now = performance.now();
    if (report && now - lastReport >= report) {
      postMessage({ type: "tick", units });
      lastReport = now;
    }
    if (now - t0 >= duration) break;
  }
  postMessage({ type: "done", units, elapsed: performance.now() - t0 });
};
`;

const CORES = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 1 : 1;
const STRESS_SECONDS = 60;

function makeWorker() {
  const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
  const worker = new Worker(url);
  URL.revokeObjectURL(url);
  return worker;
}

// run `count` workers for `duration` ms, resolve with total units/second
function runLoad(count, duration, workersOut) {
  return new Promise((resolve) => {
    let done = 0;
    let totalUnits = 0;
    let maxElapsed = 0;
    for (let i = 0; i < count; i++) {
      const w = makeWorker();
      workersOut.push(w);
      w.onmessage = (e) => {
        if (e.data.type !== "done") return;
        totalUnits += e.data.units;
        maxElapsed = Math.max(maxElapsed, e.data.elapsed);
        w.terminate();
        if (++done === count) resolve((totalUnits * 1000) / maxElapsed);
      };
      w.postMessage({ duration });
    }
  });
}

export default function CpuTester() {
  const t = useT();
  useDocTitle(t("cpu"));

  const [phase, setPhase] = useState("idle"); // idle | single | multi | done
  const [single, setSingle] = useState(null);
  const [multi, setMulti] = useState(null);

  const [stress, setStress] = useState(false);
  const [stressLeft, setStressLeft] = useState(0);
  const [drop, setDrop] = useState(null);
  const workersRef = useRef([]);
  const canvasRef = useRef(null);
  const samplesRef = useRef([]);

  const killWorkers = () => {
    workersRef.current.forEach((w) => w.terminate());
    workersRef.current = [];
  };
  useEffect(() => killWorkers, []);

  const runBenchmark = async () => {
    setSingle(null);
    setMulti(null);
    setPhase("single");
    const s = await runLoad(1, 5000, workersRef.current);
    setSingle(Math.round(s * 10));
    setPhase("multi");
    const m = await runLoad(CORES, 5000, workersRef.current);
    setMulti(Math.round(m * 10));
    workersRef.current = [];
    setPhase("done");
  };

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    const samples = samplesRef.current;
    ctx.clearRect(0, 0, width, height);
    if (samples.length < 2) return;
    const peak = Math.max(...samples);
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    samples.forEach((v, i) => {
      const x = (i / (STRESS_SECONDS - 1)) * (width - 8) + 4;
      const y = height - 6 - (v / peak) * (height - 12);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  const stopStress = () => {
    killWorkers();
    setStress(false);
    setStressLeft(0);
  };

  const runStress = () => {
    killWorkers();
    samplesRef.current = [];
    setDrop(null);
    setStress(true);
    setStressLeft(STRESS_SECONDS);

    const counts = new Array(CORES).fill(0);
    for (let i = 0; i < CORES; i++) {
      const w = makeWorker();
      workersRef.current.push(w);
      w.onmessage = (e) => {
        if (e.data.type === "tick" || e.data.type === "done") counts[i] = e.data.units;
      };
      w.postMessage({ duration: STRESS_SECONDS * 1000, report: 500 });
    }

    let prevTotal = 0;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed++;
      const total = counts.reduce((a, b) => a + b, 0);
      if (elapsed > 1) samplesRef.current.push(total - prevTotal); // skip warm-up second
      prevTotal = total;
      drawChart();
      setStressLeft(STRESS_SECONDS - elapsed);

      const samples = samplesRef.current;
      if (samples.length >= 5) {
        const peak = Math.max(...samples);
        const recent = samples.slice(-3).reduce((a, b) => a + b, 0) / 3;
        setDrop(Math.max(0, Math.round((1 - recent / peak) * 100)));
      }
      if (elapsed >= STRESS_SECONDS) {
        clearInterval(interval);
        stopStress();
      }
    }, 1000);
    workersRef.current.push({ terminate: () => clearInterval(interval) });
  };

  const busy = phase === "single" || phase === "multi";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">⚙️ {t("cpu")}</h1>

      <div className="grid gap-3 sm:grid-cols-4 mb-6">
        <div className="rounded-xl border border-border bg-bg-card px-4 py-3">
          <div className="text-xs text-text-muted">{t("cpuCores")}</div>
          <div className="text-lg font-semibold tabular-nums">{CORES}</div>
        </div>
        <div className="rounded-xl border border-border bg-bg-card px-4 py-3">
          <div className="text-xs text-text-muted">{t("cpuSingle")}</div>
          <div className="text-lg font-semibold tabular-nums">
            {phase === "single" ? "…" : single ?? "—"}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-bg-card px-4 py-3">
          <div className="text-xs text-text-muted">{t("cpuMulti")}</div>
          <div className="text-lg font-semibold tabular-nums">
            {phase === "multi" ? "…" : multi ?? "—"}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-bg-card px-4 py-3">
          <div className="text-xs text-text-muted">{t("cpuScaling")}</div>
          <div className="text-lg font-semibold tabular-nums">
            {single && multi ? `${(multi / single).toFixed(1)}×` : "—"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-5 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-text-muted mr-auto">{t("cpuIdle")}</p>
          <button
            onClick={runBenchmark}
            disabled={busy || stress}
            className="px-4 py-1.5 rounded-full text-sm font-medium bg-accent text-bg-primary hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {busy ? t("cpuRunning") : t("cpuBench")}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h2 className="text-lg font-semibold">{t("cpuStress")}</h2>
            <p className="text-sm text-text-muted mt-1">{t("cpuStressDesc")}</p>
          </div>
          {drop != null && (
            <div className={`text-sm tabular-nums ${drop > 15 ? "text-red-500" : "text-text-secondary"}`}>
              {t("cpuDrop")}: <span className="font-semibold">{drop}%</span>
            </div>
          )}
          <button
            onClick={() => (stress ? stopStress() : runStress())}
            disabled={busy}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
              stress
                ? "border border-red-400 text-red-500 hover:bg-red-500/10"
                : "bg-accent text-bg-primary hover:bg-accent-hover"
            }`}
          >
            {stress ? `${t("cpuStressStop")} (${stressLeft}s)` : t("cpuStressStart")}
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={900}
          height={140}
          className="w-full h-36 mt-4 rounded-xl border border-border bg-bg-secondary/50"
        />
      </div>

      <p className="text-xs text-text-muted mt-6">💡 {t("cpuDisclaimer")}</p>
    </div>
  );
}
