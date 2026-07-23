import { useEffect, useRef, useState } from "react";
import SpeedTest from "@cloudflare/speedtest";
import ndt7 from "@m-lab/ndt7";
import ndtDownloadWorkerSource from "@m-lab/ndt7/src/ndt7-download-worker.js?raw";
import ndtUploadWorkerSource from "@m-lab/ndt7/src/ndt7-upload-worker.js?raw";
import { useDocTitle, useT } from "./testersUtils";

const PING_SAMPLES = 10;
const DOWNLOAD_CALIBRATION_BYTES = 1_000_000;
const UPLOAD_CALIBRATION_BYTES = 250_000;
const DOWNLOAD_DURATION_MS = 6_000;
const UPLOAD_DURATION_MS = 6_000;
const MAX_DOWNLOAD_TOTAL_BYTES = 192_000_000;
const MAX_UPLOAD_TOTAL_BYTES = 72_000_000;
const SPEED_UNIT_STORAGE_KEY = "network-speed-unit";
const SERVER_STORAGE_KEY = "network-test-server";
const TEST_SERVERS = [
  {
    id: "cloudflare",
    labelKey: "ntServerCloudflare",
    engine: "cloudflare",
  },
  {
    id: "mlab",
    labelKey: "ntServerMlab",
    engine: "mlab",
  },
  {
    id: "website",
    labelKey: "ntServerWebsite",
    engine: "website",
    downloadUrl: "/api/messages",
    uploadUrl: "/api/messages",
    params: { networkTest: "1" },
  },
];
const CLOUDFLARE_MEASUREMENTS = [
  { type: "latency", numPackets: 2 },
  { type: "download", bytes: 100_000, count: 1, bypassMinDuration: true },
  { type: "latency", numPackets: 20 },
  { type: "download", bytes: 100_000, count: 9 },
  { type: "download", bytes: 1_000_000, count: 8 },
  { type: "upload", bytes: 100_000, count: 8 },
  { type: "upload", bytes: 1_000_000, count: 6 },
  { type: "download", bytes: 10_000_000, count: 6 },
  { type: "upload", bytes: 10_000_000, count: 4 },
  { type: "download", bytes: 25_000_000, count: 4 },
  { type: "upload", bytes: 25_000_000, count: 4 },
  { type: "download", bytes: 100_000_000, count: 3 },
  { type: "upload", bytes: 50_000_000, count: 3 },
  { type: "download", bytes: 250_000_000, count: 2 },
];
const SPEED_UNITS = {
  Kbps: { multiplier: 1_000, decimals: 0 },
  Mbps: { multiplier: 1, decimals: 1 },
  Gbps: { multiplier: 0.001, decimals: 3 },
  "KB/s": { multiplier: 125, decimals: 1 },
  "MB/s": { multiplier: 0.125, decimals: 2 },
  "GB/s": { multiplier: 0.000_125, decimals: 3 },
};

function initialSpeedUnit() {
  try {
    const savedUnit = window.localStorage.getItem(SPEED_UNIT_STORAGE_KEY);
    return Object.hasOwn(SPEED_UNITS, savedUnit) ? savedUnit : "Mbps";
  } catch {
    return "Mbps";
  }
}

function initialServerId() {
  try {
    const savedServer = window.localStorage.getItem(SERVER_STORAGE_KEY);
    return TEST_SERVERS.some((server) => server.id === savedServer) ? savedServer : "cloudflare";
  } catch {
    return "cloudflare";
  }
}

function displaySpeed(value, unit) {
  if (value == null) return value;
  const config = SPEED_UNITS[unit] || SPEED_UNITS.Mbps;
  return Number((value * config.multiplier).toFixed(config.decimals));
}

function testUrl(baseUrl, params) {
  const url = new URL(baseUrl, window.location.origin);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const mbps = (bytes, milliseconds) => (bytes * 8) / Math.max(milliseconds, 1) / 1_000;
const rounded = (value, decimals = 0) => Number.isFinite(value) ? Number(value.toFixed(decimals)) : null;

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

async function receiveBytes(server, bytes, signal, onBytes = () => {}) {
  const response = await fetch(testUrl(server.downloadUrl, {
    ...server.params,
    bytes,
    nonce: `${Date.now()}-${Math.random()}`,
  }), {
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

async function sendBytes(server, payload, signal) {
  const response = await fetch(testUrl(server.uploadUrl, {
    ...server.params,
    upload: `${Date.now()}-${Math.random()}`,
  }), {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: payload,
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Upload failed");
  await response.arrayBuffer();
  return payload.byteLength;
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
  if ((loss != null && loss > 10) || (ping != null && ping > 150) || (jitter != null && jitter > 50) || download < 5 || upload < 1) return "poor";
  if ((loss != null && loss > 0) || (ping != null && ping > 70) || (jitter != null && jitter > 25) || download < 25 || upload < 5) return "fair";
  return "good";
}

function finalizeResults(values) {
  const results = {
    ping: rounded(values.ping),
    jitter: rounded(values.jitter),
    loss: rounded(values.loss),
    download: rounded(values.download, 1),
    upload: rounded(values.upload, 1),
    server: values.server || "",
  };
  return { ...results, quality: qualityOf(results) };
}

async function runWebsiteTest(server, controller, setStatus, setProgress, unavailableMessage) {
  const pings = [];
  let failures = 0;
  for (let index = 0; index < PING_SAMPLES; index += 1) {
    const started = performance.now();
    try {
      const response = await fetch(testUrl(server.downloadUrl, {
        ...server.params,
        bytes: 0,
        ping: `${Date.now()}-${index}`,
      }), { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Ping failed");
      await response.arrayBuffer();
      pings.push(performance.now() - started);
    } catch (error) {
      if (error.name === "AbortError") throw error;
      failures += 1;
    }
    setProgress(5 + Math.round(((index + 1) / PING_SAMPLES) * 15));
    await wait(80);
  }
  if (!pings.length) throw new Error(unavailableMessage);

  const ping = Math.min(...pings);
  const differences = pings.slice(1).map((value, index) => Math.abs(value - pings[index]));
  const jitter = differences.length ? median(differences) : 0;
  const loss = (failures / PING_SAMPLES) * 100;

  setStatus("download");
  setProgress(22);
  const downloadCalibrationStarted = performance.now();
  await receiveBytes(server, DOWNLOAD_CALIBRATION_BYTES, controller.signal);
  const downloadEstimate = mbps(DOWNLOAD_CALIBRATION_BYTES, performance.now() - downloadCalibrationStarted);
  const downloadConfig = downloadSettings(downloadEstimate);
  const download = await runTimedTransfer({
    duration: DOWNLOAD_DURATION_MS,
    connections: downloadConfig.connections,
    maxBytes: MAX_DOWNLOAD_TOTAL_BYTES,
    transfer: (record) => receiveBytes(server, downloadConfig.bytes, controller.signal, record),
    onProgress: (value) => setProgress(25 + Math.round(value * 40)),
  });

  setStatus("upload");
  setProgress(68);
  const uploadCalibrationData = new Uint8Array(UPLOAD_CALIBRATION_BYTES);
  const uploadCalibrationStarted = performance.now();
  await sendBytes(server, uploadCalibrationData, controller.signal);
  const uploadEstimate = mbps(UPLOAD_CALIBRATION_BYTES, performance.now() - uploadCalibrationStarted);
  const uploadConfig = uploadSettings(uploadEstimate);
  const uploadData = new Uint8Array(uploadConfig.bytes);
  const upload = await runTimedTransfer({
    duration: UPLOAD_DURATION_MS,
    connections: uploadConfig.connections,
    maxBytes: MAX_UPLOAD_TOTAL_BYTES,
    transfer: async (record) => record(await sendBytes(server, uploadData, controller.signal)),
    onProgress: (value) => setProgress(70 + Math.round(value * 30)),
  });

  return finalizeResults({ ping, jitter, loss, download, upload, server: "testers.remker1.dev" });
}

function runCloudflareTest(registerAbort, setStatus, setProgress) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let progress = 5;
    const engine = new SpeedTest({
      autoStart: false,
      logAimApiUrl: null,
      measurements: CLOUDFLARE_MEASUREMENTS,
    });
    registerAbort(() => engine.pause());

    engine.onResultsChange = ({ type }) => {
      if (settled) return;
      if (type === "upload") setStatus("upload");
      else if (type === "download") setStatus("download");
      else setStatus("ping");
      progress = Math.min(progress + 3, 96);
      setProgress(progress);
    };
    engine.onError = (error) => {
      if (settled) return;
      settled = true;
      engine.pause();
      reject(new Error(String(error)));
    };
    engine.onFinish = (result) => {
      if (settled) return;
      settled = true;
      const summary = result.getSummary();
      resolve(finalizeResults({
        ping: summary.latency,
        jitter: summary.jitter,
        loss: Number.isFinite(summary.packetLoss) ? summary.packetLoss * 100 : null,
        download: Number.isFinite(summary.download) ? summary.download / 1_000_000 : null,
        upload: Number.isFinite(summary.upload) ? summary.upload / 1_000_000 : null,
        server: "Cloudflare Global Edge",
      }));
    };
    engine.play();
  });
}

function runMlabTest(registerAbort, setStatus, setProgress) {
  return new Promise((resolve, reject) => {
    let active = true;
    let settled = false;
    let download = null;
    let upload = null;
    let serverName = "M-Lab";
    const rtts = [];
    const downloadWorkerUrl = URL.createObjectURL(new Blob([ndtDownloadWorkerSource], { type: "text/javascript" }));
    const uploadWorkerUrl = URL.createObjectURL(new Blob([ndtUploadWorkerSource], { type: "text/javascript" }));
    const cleanup = () => {
      URL.revokeObjectURL(downloadWorkerUrl);
      URL.revokeObjectURL(uploadWorkerUrl);
    };
    registerAbort(() => { active = false; });

    const captureRtt = ({ Source, Data }) => {
      if (Source === "server" && Number.isFinite(Data?.TCPInfo?.RTT)) {
        rtts.push(Data.TCPInfo.RTT / 1_000);
      }
    };
    const callbacks = {
      error: (message) => {
        if (!active || settled) return;
        settled = true;
        reject(new Error(String(message)));
      },
      serverChosen: (server) => {
        const city = server?.location?.city;
        const country = server?.location?.country;
        serverName = [city, country].filter(Boolean).join(", ") || server?.machine || "M-Lab";
      },
      downloadStart: () => {
        if (active) setStatus("download");
      },
      downloadMeasurement: (measurement) => {
        if (!active) return;
        captureRtt(measurement);
        if (measurement.Source === "client" && Number.isFinite(measurement.Data?.MeanClientMbps)) {
          download = measurement.Data.MeanClientMbps;
          setProgress(20 + Math.min(Math.round((measurement.Data.ElapsedTime / 10) * 40), 40));
        }
      },
      downloadComplete: ({ LastClientMeasurement, LastServerMeasurement }) => {
        if (Number.isFinite(LastClientMeasurement?.MeanClientMbps)) download = LastClientMeasurement.MeanClientMbps;
        captureRtt({ Source: "server", Data: LastServerMeasurement });
      },
      uploadStart: () => {
        if (active) setStatus("upload");
      },
      uploadMeasurement: (measurement) => {
        if (!active) return;
        captureRtt(measurement);
        if (measurement.Source === "client" && Number.isFinite(measurement.Data?.MeanClientMbps)) {
          upload = measurement.Data.MeanClientMbps;
          setProgress(60 + Math.min(Math.round((measurement.Data.ElapsedTime / 10) * 40), 39));
        }
      },
      uploadComplete: ({ LastClientMeasurement, LastServerMeasurement }) => {
        if (Number.isFinite(LastClientMeasurement?.MeanClientMbps)) upload = LastClientMeasurement.MeanClientMbps;
        captureRtt({ Source: "server", Data: LastServerMeasurement });
      },
    };

    ndt7.test({
      userAcceptedDataPolicy: true,
      metadata: { client_name: "testers.remker1.dev", client_version: "1.0.0" },
      downloadworkerfile: downloadWorkerUrl,
      uploadworkerfile: uploadWorkerUrl,
    }, callbacks).then((code) => {
      cleanup();
      if (!active || settled) return;
      if (code !== 0 || !Number.isFinite(download) || !Number.isFinite(upload)) {
        settled = true;
        reject(new Error("M-Lab test did not complete"));
        return;
      }
      settled = true;
      const ping = rtts.length ? median(rtts) : null;
      const differences = rtts.slice(1).map((value, index) => Math.abs(value - rtts[index]));
      resolve(finalizeResults({
        ping,
        jitter: differences.length ? median(differences) : null,
        loss: null,
        download,
        upload,
        server: serverName,
      }));
    }).catch((error) => {
      cleanup();
      if (!active || settled) return;
      settled = true;
      reject(error);
    });
  });
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
  const [speedUnit, setSpeedUnit] = useState(initialSpeedUnit);
  const [serverId, setServerId] = useState(initialServerId);
  const [mlabConsent, setMlabConsent] = useState(false);

  useEffect(() => () => abortRef.current?.(), []);

  const changeSpeedUnit = (event) => {
    const nextUnit = event.target.value;
    setSpeedUnit(nextUnit);
    try {
      window.localStorage.setItem(SPEED_UNIT_STORAGE_KEY, nextUnit);
    } catch {
      return;
    }
  };

  const changeServer = (event) => {
    const nextServer = event.target.value;
    setServerId(nextServer);
    setResults(null);
    setError("");
    try {
      window.localStorage.setItem(SERVER_STORAGE_KEY, nextServer);
    } catch {
      return;
    }
  };

  const runTest = async () => {
    abortRef.current?.();
    abortRef.current = null;
    const server = TEST_SERVERS.find((item) => item.id === serverId) || TEST_SERVERS[0];
    const registerAbort = (abort) => { abortRef.current = abort; };
    setStatus("ping");
    setProgress(5);
    setResults(null);
    setError("");

    try {
      let nextResults;
      if (server.engine === "cloudflare") {
        nextResults = await runCloudflareTest(registerAbort, setStatus, setProgress);
      } else if (server.engine === "mlab") {
        nextResults = await runMlabTest(registerAbort, setStatus, setProgress);
      } else {
        const controller = new AbortController();
        registerAbort(() => controller.abort());
        nextResults = await runWebsiteTest(server, controller, setStatus, setProgress, t("ntUnavailable"));
      }
      setResults(nextResults);
      setProgress(100);
      setStatus("done");
    } catch (testError) {
      if (testError.name === "AbortError") return;
      setError(testError.message || t("ntUnavailable"));
      setStatus("error");
    } finally {
      abortRef.current = null;
    }
  };

  const statusLabel = status === "ping" ? t("ntTestingPing") : status === "download" ? t("ntTestingDownload") : status === "upload" ? t("ntTestingUpload") : "";
  const running = ["ping", "download", "upload"].includes(status);
  const mlabNeedsConsent = serverId === "mlab" && !mlabConsent;

  return (
    <div>
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">🌐 {t("network")}</h1>
        <p className="mt-2 text-text-secondary">{t("ntIntro")}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button onClick={runTest} disabled={running || mlabNeedsConsent} className="px-6 py-3 rounded-xl bg-accent text-bg-primary font-semibold hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {running ? statusLabel : results ? t("ntAgain") : t("ntStart")}
          </button>
          <label className="flex items-center gap-2 rounded-xl border border-border bg-bg-card px-3 py-2 text-sm text-text-secondary">
            <span>{t("ntServer")}</span>
            <select value={serverId} onChange={changeServer} disabled={running} className="rounded-lg border border-border bg-bg-primary px-2 py-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50">
              {TEST_SERVERS.map((server) => <option key={server.id} value={server.id}>{t(server.labelKey)}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-border bg-bg-card px-3 py-2 text-sm text-text-secondary">
            <span>{t("ntSpeedUnit")}</span>
            <select value={speedUnit} onChange={changeSpeedUnit} className="rounded-lg border border-border bg-bg-primary px-2 py-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent">
              {Object.keys(SPEED_UNITS).map((unit) => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </label>
        </div>

        {serverId === "mlab" && (
          <label className="mt-4 mx-auto flex max-w-2xl items-start gap-3 rounded-xl border border-border bg-bg-card p-4 text-left text-sm text-text-secondary">
            <input type="checkbox" checked={mlabConsent} onChange={(event) => setMlabConsent(event.target.checked)} disabled={running} className="mt-1 accent-accent" />
            <span>
              {t("ntMlabConsent")} {" "}
              <a href="https://www.measurementlab.net/privacy/" target="_blank" rel="noreferrer" className="text-accent hover:text-accent-hover underline">{t("ntMlabPolicy")}</a>
            </span>
          </label>
        )}
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
        <ResultCard icon="⬇️" label={t("ntDownload")} value={displaySpeed(results?.download, speedUnit)} unit={speedUnit} hint={t("ntDownloadHint")} />
        <ResultCard icon="⬆️" label={t("ntUpload")} value={displaySpeed(results?.upload, speedUnit)} unit={speedUnit} hint={t("ntUploadHint")} />
      </div>

      {results && (
        <>
          <div className={`mt-6 rounded-2xl border p-5 ${results.quality === "good" ? "border-green-500/40 bg-green-500/10" : results.quality === "fair" ? "border-yellow-500/40 bg-yellow-500/10" : "border-red-500/40 bg-red-500/10"}`}>
            <div className="font-semibold">{t("ntQuality")}: {t(`ntQuality${results.quality[0].toUpperCase()}${results.quality.slice(1)}`)}</div>
            <p className="mt-1 text-sm text-text-secondary">{t(`ntQuality${results.quality[0].toUpperCase()}${results.quality.slice(1)}Desc`)}</p>
          </div>
          <p className="mt-3 text-sm text-text-muted">📍 {t("ntConnectedServer")}: {results.server}</p>
        </>
      )}

      <p className="mt-6 text-sm text-text-muted">ℹ️ {t("ntDisclaimer")}</p>
      <p className="mt-2 text-xs text-text-muted">{t("ntCostNotice")}</p>
    </div>
  );
}
