import { useEffect, useRef, useState } from "react";
import { useT, useDocTitle } from "./testersUtils";

function errorKey(err) {
  if (err?.name === "NotAllowedError" || err?.name === "SecurityError") return "wcDenied";
  if (err?.name === "NotFoundError" || err?.name === "OverconstrainedError") return "wcNotFound";
  if (err?.name === "NotReadableError" || err?.name === "AbortError") return "wcInUse";
  return null;
}

export default function WebcamTester() {
  const t = useT();
  useDocTitle(t("webcam"));

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [running, setRunning] = useState(false);
  const [mirror, setMirror] = useState(true);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [measuredFps, setMeasuredFps] = useState(null);

  const stop = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
    setInfo(null);
    setMeasuredFps(null);
  };

  const start = async (id = deviceId) => {
    stop();
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: id ? { deviceId: { exact: id } } : true,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});
      setRunning(true);

      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      setInfo({
        label: track.label,
        width: settings.width,
        height: settings.height,
        frameRate: settings.frameRate,
      });
      if (settings.deviceId) setDeviceId(settings.deviceId);

      // labels only become available after permission is granted
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((d) => d.kind === "videoinput"));

      // measure real FPS via rVFC when available
      if (video.requestVideoFrameCallback) {
        let frames = 0;
        let lastT = performance.now();
        const tick = (now) => {
          if (video.srcObject !== stream) return;
          frames += 1;
          if (now - lastT >= 1000) {
            setMeasuredFps(Math.round((frames * 1000) / (now - lastT)));
            frames = 0;
            lastT = now;
          }
          video.requestVideoFrameCallback(tick);
        };
        video.requestVideoFrameCallback(tick);
      }
    } catch (err) {
      console.error(err);
      const key = errorKey(err);
      setError(key ? t(key) : `${t("wcError")}: ${err.message}`);
    }
  };

  const snapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `webcam-test-${Date.now()}.png`;
    a.click();
  };

  useEffect(() => stop, []);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold mr-auto">📷 {t("webcam")}</h1>
        {devices.length > 0 && (
          <select
            value={deviceId}
            onChange={(e) => {
              setDeviceId(e.target.value);
              if (running) start(e.target.value);
            }}
            className="px-3 py-1.5 rounded-lg border border-border bg-bg-card text-sm max-w-56"
            aria-label={t("wcDevice")}
          >
            {devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `${t("wcDevice")} ${i + 1}`}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={mirror}
            onChange={(e) => setMirror(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          {t("wcMirror")}
        </label>
        <button
          onClick={() => (running ? stop() : start())}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            running
              ? "border border-border text-text-secondary hover:bg-bg-secondary"
              : "bg-accent text-bg-primary hover:bg-accent-hover"
          }`}
        >
          {running ? t("wcStop") : t("wcStart")}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-black/90 aspect-video overflow-hidden flex items-center justify-center relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain ${mirror ? "scale-x-[-1]" : ""} ${running ? "" : "hidden"}`}
        />
        {!running && (
          <p className="text-sm text-white/60 px-8 text-center">{error || t("wcIdle")}</p>
        )}
        {running && error && (
          <p className="absolute bottom-3 left-3 right-3 text-sm text-red-300">{error}</p>
        )}
      </div>

      {running && info && (
        <div className="grid gap-3 sm:grid-cols-4 mt-4">
          <div className="rounded-xl border border-border bg-bg-card px-4 py-3 sm:col-span-2">
            <div className="text-xs text-text-muted">{t("wcDevice")}</div>
            <div className="text-sm font-medium truncate">{info.label || "—"}</div>
          </div>
          <div className="rounded-xl border border-border bg-bg-card px-4 py-3">
            <div className="text-xs text-text-muted">{t("wcResolution")}</div>
            <div className="text-sm font-medium tabular-nums">
              {info.width} × {info.height}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-bg-card px-4 py-3">
            <div className="text-xs text-text-muted">
              {measuredFps != null ? t("wcMeasuredFps") : t("wcFps")}
            </div>
            <div className="text-sm font-medium tabular-nums">
              {measuredFps != null ? measuredFps : info.frameRate ? Math.round(info.frameRate) : "—"}{" "}
              fps
            </div>
          </div>
        </div>
      )}

      {running && (
        <button
          onClick={snapshot}
          className="mt-4 px-4 py-1.5 rounded-full text-sm border border-border text-text-secondary hover:bg-bg-secondary transition-colors"
        >
          📸 {t("wcSnapshot")}
        </button>
      )}
    </div>
  );
}
