import { useEffect, useRef, useState } from "react";
import { useT, useDocTitle } from "./testersUtils";

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform float u_iters;
uniform float u_time;
out vec4 o;
void main() {
  vec2 uv = gl_FragCoord.xy / vec2(1280.0, 720.0);
  float a = 0.0;
  for (float i = 0.0; i < u_iters; i++) {
    a += sin(uv.x * (i + 1.0) + u_time) * cos(uv.y * (i + 1.0) - u_time * 0.7);
  }
  a /= max(u_iters, 1.0);
  o = vec4(0.5 + 0.5 * sin(a * 6.0 + u_time),
           0.5 + 0.5 * cos(a * 8.0 - u_time),
           0.5 + 0.5 * sin(a * 4.0 + u_time * 1.3), 1.0);
}`;

// "ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Unspecified Version)" → "Apple M3 Pro"
function cleanRenderer(raw) {
  if (!raw) return raw;
  let s = raw;
  const m = raw.match(/^ANGLE \((.*)\)$/);
  if (m) {
    const parts = m[1].split(", ");
    s = parts.length >= 2 ? parts[1] : m[1];
  }
  return s
    .replace(/^ANGLE [^:]*Renderer: /, "")
    .replace(/ \(0x[0-9A-Fa-f]+\)/, "")
    .replace(/ Direct3D\d+.*$/, "")
    .trim();
}

function getGpuInfo() {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
  if (!gl) return { renderer: null, raw: null, webgl2: false };
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  const raw = ext
    ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
    : gl.getParameter(gl.RENDERER);
  const webgl2 = !!canvas.getContext("webgl2");
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  return { renderer: cleanRenderer(raw), raw, webgl2 };
}

const ADAPT_MS = 6000; // grow the load until FPS settles
const MEASURE_MS = 6000; // then average

export default function GpuTester() {
  const t = useT();
  useDocTitle(t("gpu"));

  const [info] = useState(getGpuInfo);
  const [webgpu, setWebgpu] = useState(null);
  const [running, setRunning] = useState(false);
  const [fps, setFps] = useState(0);
  const [iters, setIters] = useState(0);
  const [score, setScore] = useState(null);
  const canvasRef = useRef(null);
  const stopRef = useRef(null);

  useEffect(() => {
    if (!navigator.gpu) {
      setWebgpu(false);
      return;
    }
    navigator.gpu
      .requestAdapter()
      .then((adapter) => setWebgpu(!!adapter))
      .catch(() => setWebgpu(false));
  }, []);

  useEffect(() => () => stopRef.current?.(), []);

  const runBenchmark = () => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl2", { antialias: false, powerPreference: "high-performance" });
    if (!gl) return;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const uIters = gl.getUniformLocation(prog, "u_iters");
    const uTime = gl.getUniformLocation(prog, "u_time");
    gl.viewport(0, 0, canvas.width, canvas.height);

    setRunning(true);
    setScore(null);

    let load = 20;
    let frames = 0;
    let windowStart = performance.now();
    const t0 = performance.now();
    let measureFrames = 0;
    let measureStart = null;
    let raf;

    const tick = (now) => {
      gl.uniform1f(uIters, load);
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      frames++;
      const elapsed = now - t0;
      if (measureStart != null) measureFrames++;

      if (now - windowStart >= 500) {
        const winFps = (frames * 1000) / (now - windowStart);
        setFps(Math.round(winFps));
        frames = 0;
        windowStart = now;
        if (elapsed < ADAPT_MS) {
          // push load up until the GPU falls off the vsync cap
          if (winFps > 50) load = Math.min(load * 1.6, 20000);
          else if (winFps < 20) load = Math.max(load / 1.4, 1);
          setIters(Math.round(load));
        } else if (measureStart == null) {
          measureStart = now;
          measureFrames = 0;
        }
      }

      if (measureStart != null && now - measureStart >= MEASURE_MS) {
        const avgFps = (measureFrames * 1000) / (now - measureStart);
        setScore(Math.round((load * avgFps) / 10));
        setFps(Math.round(avgFps));
        cleanup();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const cleanup = () => {
      cancelAnimationFrame(raf);
      setRunning(false);
      stopRef.current = null;
    };
    stopRef.current = () => cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  };

  const supportBadge = (ok) =>
    ok == null ? "…" : ok ? `✓ ${t("gpuSupported")}` : `✗ ${t("gpuNot")}`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🎮 {t("gpu")}</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-xl border border-border bg-bg-card px-4 py-3 lg:col-span-2">
          <div className="text-xs text-text-muted">{t("gpuModel")}</div>
          <div className="text-sm font-medium truncate" title={info.raw || ""}>
            {info.renderer || "—"}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-bg-card px-4 py-3">
          <div className="text-xs text-text-muted">WebGL 2</div>
          <div className="text-sm font-medium">{supportBadge(info.webgl2)}</div>
        </div>
        <div className="rounded-xl border border-border bg-bg-card px-4 py-3">
          <div className="text-xs text-text-muted">WebGPU</div>
          <div className="text-sm font-medium">{supportBadge(webgpu)}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <p className="text-sm text-text-muted mr-auto">{t("gpuIdle")}</p>
          <div className="text-sm text-text-secondary tabular-nums font-mono">
            {running && `${fps} fps · ${t("gpuLoad")} ${iters}`}
            {score != null && !running && (
              <>
                {t("gpuScore")}: <span className="text-accent font-semibold text-lg">{score}</span>
                {` · ${fps} fps × ${iters}`}
              </>
            )}
          </div>
          <button
            onClick={runBenchmark}
            disabled={running || !info.webgl2}
            className="px-4 py-1.5 rounded-full text-sm font-medium bg-accent text-bg-primary hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {running ? t("gpuRunning") : t("gpuBench")}
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full rounded-xl border border-border bg-black aspect-video"
        />
        {!info.webgl2 && <p className="text-sm text-red-500 mt-3">{t("gpuNoWebgl2")}</p>}
      </div>

      <p className="text-xs text-text-muted mt-6">💡 {t("gpuDisclaimer")}</p>
    </div>
  );
}
