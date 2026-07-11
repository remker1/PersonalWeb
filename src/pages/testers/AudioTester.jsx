import { useEffect, useRef, useState } from "react";
import { useT, useDocTitle } from "./testersUtils";

const SUPPORTS_SINK =
  typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;

const FREQ_PRESETS = [100, 440, 1000, 5000, 10000];

export default function AudioTester() {
  const t = useT();
  useDocTitle(t("audio"));

  /* ── speaker ── */
  const ctxRef = useRef(null);
  const oscRef = useRef(null);
  const pannerRef = useRef(null);
  const sinkAudioRef = useRef(null);
  const [freq, setFreq] = useState(440);
  const [activePan, setActivePan] = useState(null); // -1 | 0 | 1 | null
  const [outputs, setOutputs] = useState([]);
  const [outputId, setOutputId] = useState("");

  const getCtx = () => {
    if (!ctxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      if (SUPPORTS_SINK) {
        const dest = ctx.createMediaStreamDestination();
        ctxRef.current._dest = dest;
        const audio = new Audio();
        audio.srcObject = dest.stream;
        audio.play().catch(() => {});
        sinkAudioRef.current = audio;
        navigator.mediaDevices
          ?.enumerateDevices()
          .then((all) => setOutputs(all.filter((d) => d.kind === "audiooutput")))
          .catch(() => {});
      }
    }
    ctxRef.current.resume();
    return ctxRef.current;
  };

  const stopTone = () => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
      } catch { /* already stopped */ }
      oscRef.current.disconnect();
      oscRef.current = null;
    }
    setActivePan(null);
  };

  const playTone = (pan) => {
    if (activePan === pan) {
      stopTone();
      return;
    }
    const ctx = getCtx();
    stopTone();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    const panner = ctx.createStereoPanner
      ? ctx.createStereoPanner()
      : null;
    if (panner) panner.pan.value = pan;
    pannerRef.current = panner;
    const dest = SUPPORTS_SINK ? ctx._dest : ctx.destination;
    if (panner) {
      osc.connect(gain).connect(panner).connect(dest);
    } else {
      osc.connect(gain).connect(dest);
    }
    osc.start();
    oscRef.current = osc;
    setActivePan(pan);
  };

  const changeOutput = async (id) => {
    setOutputId(id);
    try {
      await sinkAudioRef.current?.setSinkId(id);
    } catch (err) {
      console.error("setSinkId failed", err);
    }
  };

  useEffect(() => {
    if (oscRef.current) oscRef.current.frequency.value = freq;
  }, [freq]);

  /* ── microphone ── */
  const micStreamRef = useRef(null);
  const rafRef = useRef(null);
  const canvasRef = useRef(null);
  const recorderRef = useRef(null);
  const [micDevices, setMicDevices] = useState([]);
  const [micId, setMicId] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [micError, setMicError] = useState(null);
  const [micInfo, setMicInfo] = useState(null);
  const [level, setLevel] = useState(0);
  const [recording, setRecording] = useState(false);
  const [clipUrl, setClipUrl] = useState(null);

  const stopMic = () => {
    cancelAnimationFrame(rafRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    setMicOn(false);
    setMicInfo(null);
    setLevel(0);
    setRecording(false);
  };

  const startMic = async (id = micId) => {
    stopMic();
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: id ? { deviceId: { exact: id } } : true,
      });
      micStreamRef.current = stream;
      setMicOn(true);

      const track = stream.getAudioTracks()[0];
      const ctx = getCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      setMicInfo({ label: track.label, sampleRate: ctx.sampleRate });
      if (track.getSettings().deviceId) setMicId(track.getSettings().deviceId);

      const all = await navigator.mediaDevices.enumerateDevices();
      setMicDevices(all.filter((d) => d.kind === "audioinput"));
      if (SUPPORTS_SINK) setOutputs(all.filter((d) => d.kind === "audiooutput"));

      const data = new Uint8Array(analyser.fftSize);
      const draw = () => {
        if (micStreamRef.current !== stream) return;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 3));

        const canvas = canvasRef.current;
        if (canvas) {
          const c = canvas.getContext("2d");
          const { width, height } = canvas;
          c.clearRect(0, 0, width, height);
          c.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue("--accent")
            .trim();
          c.lineWidth = 2;
          c.beginPath();
          for (let i = 0; i < data.length; i++) {
            const x = (i / data.length) * width;
            const y = (data[i] / 255) * height;
            i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
          }
          c.stroke();
        }
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch (err) {
      console.error(err);
      const denied = err?.name === "NotAllowedError" || err?.name === "SecurityError";
      setMicError(denied ? t("micDenied") : `${t("micError")}: ${err.message}`);
    }
  };

  const recordClip = () => {
    if (!micStreamRef.current) return;
    if (typeof MediaRecorder === "undefined") {
      setMicError(t("micRecUnsupported"));
      return;
    }
    const rec = new MediaRecorder(micStreamRef.current);
    recorderRef.current = rec;
    const chunks = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => {
      setClipUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(new Blob(chunks, { type: rec.mimeType }));
      });
      setRecording(false);
    };
    rec.start();
    setRecording(true);
    setTimeout(() => {
      if (rec.state === "recording") rec.stop();
    }, 5000);
  };

  useEffect(
    () => () => {
      stopMic();
      stopTone();
      sinkAudioRef.current?.pause();
      ctxRef.current?.close().catch(() => {});
    },
    []
  );

  const panButtons = [
    { pan: -1, label: t("spLeft"), icon: "🔈←" },
    { pan: 0, label: t("spBoth"), icon: "🔊" },
    { pan: 1, label: t("spRight"), icon: "→🔈" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">🔊 {t("audio")}</h1>

      {/* ── speaker ── */}
      <section className="rounded-2xl border border-border bg-bg-card p-6">
        <h2 className="text-lg font-semibold">{t("spTitle")}</h2>
        <p className="text-sm text-text-muted mt-1">{t("spDesc")}</p>

        <div className="flex flex-wrap gap-3 mt-5">
          {panButtons.map(({ pan, label, icon }) => (
            <button
              key={pan}
              onClick={() => playTone(pan)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                activePan === pan
                  ? "bg-accent text-bg-primary border-accent"
                  : "border-border text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              <span className="mr-1.5" aria-hidden>{icon}</span>
              {activePan === pan ? t("spStopTone") : label}
            </button>
          ))}
        </div>

        <div className="mt-5 max-w-md">
          <label className="text-sm text-text-secondary flex justify-between">
            <span>{t("spFreq")}</span>
            <span className="font-mono tabular-nums">{freq} Hz</span>
          </label>
          <input
            type="range"
            min={2}
            max={4.3}
            step={0.01}
            value={Math.log10(freq)}
            onChange={(e) => setFreq(Math.round(10 ** Number(e.target.value)))}
            className="w-full mt-1 accent-[var(--accent)]"
          />
          <div className="flex gap-2 mt-2">
            {FREQ_PRESETS.map((f) => (
              <button
                key={f}
                onClick={() => setFreq(f)}
                className={`px-2 py-0.5 rounded-md text-xs border transition-colors ${
                  freq === f
                    ? "border-accent text-accent"
                    : "border-border text-text-muted hover:bg-bg-secondary"
                }`}
              >
                {f >= 1000 ? `${f / 1000}k` : f}
              </button>
            ))}
          </div>
        </div>

        {SUPPORTS_SINK ? (
          outputs.length > 0 && (
            <div className="mt-5 max-w-md">
              <label className="text-sm text-text-secondary">{t("spOutput")}</label>
              <select
                value={outputId}
                onChange={(e) => changeOutput(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-bg-primary text-sm"
              >
                {outputs.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `${t("spOutput")} ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )
        ) : (
          <p className="text-xs text-text-muted mt-4">ℹ️ {t("spOutputUnsupported")}</p>
        )}
      </section>

      {/* ── microphone ── */}
      <section className="rounded-2xl border border-border bg-bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h2 className="text-lg font-semibold">{t("micTitle")}</h2>
            <p className="text-sm text-text-muted mt-1">{t("micDesc")}</p>
          </div>
          {micDevices.length > 0 && (
            <select
              value={micId}
              onChange={(e) => {
                setMicId(e.target.value);
                if (micOn) startMic(e.target.value);
              }}
              className="px-3 py-1.5 rounded-lg border border-border bg-bg-primary text-sm max-w-56"
              aria-label={t("micDevice")}
            >
              {micDevices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `${t("micDevice")} ${i + 1}`}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => (micOn ? stopMic() : startMic())}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              micOn
                ? "border border-border text-text-secondary hover:bg-bg-secondary"
                : "bg-accent text-bg-primary hover:bg-accent-hover"
            }`}
          >
            {micOn ? t("micStop") : t("micStart")}
          </button>
        </div>

        {micError && <p className="text-sm text-red-500 mt-4">{micError}</p>}

        {micOn && (
          <div className="mt-5 space-y-4">
            <div>
              <div className="text-xs text-text-muted mb-1">{t("micLevel")}</div>
              <div className="h-3 rounded-full bg-bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-75"
                  style={{ width: `${Math.round(level * 100)}%` }}
                />
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={800}
              height={120}
              className="w-full h-28 rounded-xl border border-border bg-bg-secondary/50"
            />

            <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
              {micInfo?.label && <span className="truncate max-w-64">🎙️ {micInfo.label}</span>}
              {micInfo?.sampleRate && (
                <span>
                  {t("micSampleRate")}: {(micInfo.sampleRate / 1000).toFixed(1)} kHz
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={recordClip}
                disabled={recording}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  recording
                    ? "border-red-400 text-red-500 animate-pulse"
                    : "border-border text-text-secondary hover:bg-bg-secondary"
                }`}
              >
                {recording ? `⏺ ${t("micRecording")}` : `⏺ ${t("micRecord")}`}
              </button>
              {clipUrl && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{t("micPlayback")}:</span>
                  <audio src={clipUrl} controls className="h-9" />
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
