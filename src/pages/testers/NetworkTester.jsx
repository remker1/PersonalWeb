import { useEffect, useRef, useState } from "react";
import { useDocTitle, useT } from "./testersUtils";

const PING_SAMPLES = 10;
const DOWNLOAD_CALIBRATION_BYTES = 1_000_000;
const UPLOAD_CALIBRATION_BYTES = 250_000;
const DOWNLOAD_DURATION_MS = 6_000;
const UPLOAD_DURATION_MS = 6_000;
const MAX_DOWNLOAD_TOTAL_BYTES = 192_000_000;
const MAX_UPLOAD_TOTAL_BYTES = 72_000_000;
const NETWORK_ENDPOINT = "/api/messages?networkTest=1";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const mbps = (bytes, milliseconds) => (bytes * 8) / Math.max(milliseconds, 1) / 1_000;

function downloadSettings(estimatedMbps) {
  return {
    connections: estimatedMbps >= 4 ? 4 : 2,
    bytes: estimatedMbps >= 100 ? 4_000_000 : estimatedMbps >= 25 ? 2_000_000 : 1_000_000,
  };
}

function uploadSettings(estimatedMbps) {
  return {
    connections: estimatedMbps >= 4 ? 4 : 2,
    bytes: estimatedMbps >= 40 ? 750_000 : estimatedMbps >= 10 ? 500_000 : 250_000,
  };
}

async function receiveBytes(bytes, signal, onBytes = () => {}) {
  const response = await fetch(`${NETWORK_ENDPOINT}&bytes=${bytes}&nonce=${Date.now()}-${Math.random()}`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Download failed");

  if (!response.body) {
    const received = (await response.arrayBuffer()).byteLength;
    onBytes(received);
    return received;
  }

  const reader = response.body.getReader();
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    onBytes(value.byteLength);
  }
  return received;
}

async function sendBytes(payload, signal) {
  const response = await fetch(`${NETWORK_ENDPOINT}&upload=${Date.now()}-${Math.random()}`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: payload,
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Upload failed");
  const result = await response.json();
  return Number(result.received) || payload.byteLength;
}

async function runTimedTransfer({ duration, connections, maxBytes, transfer, onProgress }) {
  const started = performance.now();
  const deadline = started + duration;
  let transferred = 0;
  const progressTimer = window.setInterval(() => {
    onProgress(Math.min((performance.now() - started) / duration, 1));
  }, 100);

  try {
    await Promise.all(Array.from({ length: connections }, async () => {
      while (performance.now() < deadline && transferred < maxBytes) {
        await transfer((bytes) => { transferred += bytes; });
      }
    }));
  } finally {
    window.clearInterval(progressTimer);
  }

  const elapsed = performance.now() - started;
  onProgress(1);
  return mbps(transferred, elapsed);
}

function qualityOf({ ping, jitter, loss, download, upload }) {
  if (loss > 10 || ping > 150 || jitter > 50 || download < 5 || upload < 1) return "poor";
  if (loss > 0 || ping > 70 || jitter > 25 || download < 25 || upload < 5) return "fair";
  return "good";
}

function ResultCard({ icon, label, value, unit, hint }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-5">
      <div className="text-sm text-text-muted"><span className="mr-1" aria-hidden>{icon}</span>{label}</div>
      <div className="mt-2"><span className="text-3xl font-bold tabular-nums">{value ?? "—"}</span>{value != null && <span className="ml-1 text-text-secondary">{unit}</span>}</div>
      <p className="mt-2 text-xs text-text-muted">{hint}</p>
    </div>
  );
}

export default function NetworkTester() {
  const t = useT();
  useDocTitle(t("network"));
  const abortRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => () => abortRef.current?.abort(), []);

  const runTest = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("ping");
    setProgress(5);
    setResults(null);
    setError("");

    try {
      const pings = [];
      let failures = 0;
      for (let index = 0; index < PING_SAMPLES; index += 1) {
        const started = performance.now();
        try {
          const response = await fetch(`${NETWORK_ENDPOINT}&ping=${Date.now()}-${index}`, { cache: "no-store", signal: controller.signal });
          if (!response.ok) throw new Error("Ping failed");
          await response.json();
          pings.push(performance.now() - started);
        } catch (pingError) {
          if (pingError.name === "AbortError") throw pingError;
          failures += 1;
        }
        setProgress(5 + Math.round(((index + 1) / PING_SAMPLES) * 15));
        await wait(80);
      }
      if (!pings.length) throw new Error(t("ntUnavailable"));

      const ping = Math.min(...pings);
      const differences = pings.slice(1).map((value, index) => Math.abs(value - pings[index]));
      const jitter = differences.length ? median(differences) : 0;
      const loss = (failures / PING_SAMPLES) * 100;

      setStatus("download");
      setProgress(22);
      const downloadCalibrationStarted = performance.now();
      await receiveBytes(DOWNLOAD_CALIBRATION_BYTES, controller.signal);
      const downloadEstimate = mbps(DOWNLOAD_CALIBRATION_BYTES, performance.now() - downloadCalibrationStarted);
      const downloadConfig = downloadSettings(downloadEstimate);
      const download = await runTimedTransfer({
        duration: DOWNLOAD_DURATION_MS,
        connections: downloadConfig.connections,
        maxBytes: MAX_DOWNLOAD_TOTAL_BYTES,
        transfer: (record) => receiveBytes(downloadConfig.bytes, controller.signal, record),
        onProgress: (value) => setProgress(25 + Math.round(value * 40)),
      });

      setStatus("upload");
      setProgress(68);
      const uploadCalibrationData = new Uint8Array(UPLOAD_CALIBRATION_BYTES);
      const uploadCalibrationStarted = performance.now();
      await sendBytes(uploadCalibrationData, controller.signal);
      const uploadEstimate = mbps(UPLOAD_CALIBRATION_BYTES, performance.now() - uploadCalibrationStarted);
      const uploadConfig = uploadSettings(uploadEstimate);
      const uploadData = new Uint8Array(uploadConfig.bytes);
      const upload = await runTimedTransfer({
        duration: UPLOAD_DURATION_MS,
        connections: uploadConfig.connections,
        maxBytes: MAX_UPLOAD_TOTAL_BYTES,
        transfer: async (record) => record(await sendBytes(uploadData, controller.signal)),
        onProgress: (value) => setProgress(70 + Math.round(value * 30)),
      });
      const nextResults = {
        ping: Math.round(ping),
        jitter: Math.round(jitter),
        loss: Math.round(loss),
        download: Number(download.toFixed(1)),
        upload: Number(upload.toFixed(1)),
      };
      setResults({ ...nextResults, quality: qualityOf(nextResults) });
      setProgress(100);
      setStatus("done");
    } catch (testError) {
      if (testError.name === "AbortError") return;
      setError(testError.message || t("ntUnavailable"));
      setStatus("error");
    }
  };

  const statusLabel = status === "ping" ? t("ntTestingPing") : status === "download" ? t("ntTestingDownload") : status === "upload" ? t("ntTestingUpload") : "";
  const running = ["ping", "download", "upload"].includes(status);

  return (
    <div>
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">🌐 {t("network")}</h1>
        <p className="mt-2 text-text-secondary">{t("ntIntro")}</p>
        <button onClick={runTest} disabled={running} className="mt-6 px-6 py-3 rounded-xl bg-accent text-bg-primary font-semibold hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {running ? statusLabel : results ? t("ntAgain") : t("ntStart")}
        </button>
      </div>

      {running && (
        <div className="mt-8 max-w-2xl mx-auto rounded-2xl border border-border bg-bg-card p-5">
          <div className="flex justify-between text-sm"><span>{statusLabel}</span><span className="tabular-nums">{progress}%</span></div>
          <div className="mt-3 h-2 rounded-full bg-bg-secondary overflow-hidden"><div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} /></div>
          <p className="mt-3 text-xs text-text-muted">{t("ntStay")}</p>
        </div>
      )}

      {error && <div className="mt-8 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-500">{error}</div>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ResultCard icon="↔️" label={t("ntPing")} value={results?.ping} unit="ms" hint={t("ntPingHint")} />
        <ResultCard icon="〰️" label={t("ntJitter")} value={results?.jitter} unit="ms" hint={t("ntJitterHint")} />
        <ResultCard icon="📦" label={t("ntLoss")} value={results?.loss} unit="%" hint={t("ntLossHint")} />
        <ResultCard icon="⬇️" label={t("ntDownload")} value={results?.download} unit="Mbps" hint={t("ntDownloadHint")} />
        <ResultCard icon="⬆️" label={t("ntUpload")} value={results?.upload} unit="Mbps" hint={t("ntUploadHint")} />
      </div>

      {results && (
        <div className={`mt-6 rounded-2xl border p-5 ${results.quality === "good" ? "border-green-500/40 bg-green-500/10" : results.quality === "fair" ? "border-yellow-500/40 bg-yellow-500/10" : "border-red-500/40 bg-red-500/10"}`}>
          <div className="font-semibold">{t("ntQuality")}: {t(`ntQuality${results.quality[0].toUpperCase()}${results.quality.slice(1)}`)}</div>
          <p className="mt-1 text-sm text-text-secondary">{t(`ntQuality${results.quality[0].toUpperCase()}${results.quality.slice(1)}Desc`)}</p>
        </div>
      )}

      <p className="mt-6 text-sm text-text-muted">ℹ️ {t("ntDisclaimer")}</p>
    </div>
  );
}
