import { useEffect, useMemo, useState } from "react";
import { useDocTitle, useT } from "./testersUtils";

function detectBrowser() {
  const ua = navigator.userAgent;
  const browsers = [
    [/Edg(?:A|iOS)?\/(\d+(?:\.\d+)?)/, "Microsoft Edge"],
    [/OPR\/(\d+(?:\.\d+)?)/, "Opera"],
    [/FxiOS\/(\d+(?:\.\d+)?)/, "Firefox"],
    [/Firefox\/(\d+(?:\.\d+)?)/, "Firefox"],
    [/CriOS\/(\d+(?:\.\d+)?)/, "Google Chrome"],
    [/Chrome\/(\d+(?:\.\d+)?)/, "Google Chrome"],
    [/Version\/(\d+(?:\.\d+)?).*Safari/, "Safari"],
  ];
  for (const [pattern, name] of browsers) {
    const match = ua.match(pattern);
    if (match) return `${name} ${match[1]}`;
  }
  return navigator.appName || "—";
}

function detectPlatform() {
  const ua = navigator.userAgent;
  if (/Windows NT 10/.test(ua)) return "Windows";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS / iPadOS";
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "iPadOS";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Android/.test(ua)) return "Android";
  if (/Linux/.test(ua)) return "Linux";
  return navigator.userAgentData?.platform || navigator.platform || "—";
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit > 1 ? 1 : 0)} ${units[unit]}`;
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-medium text-right break-words min-w-0">{value || "—"}</span>
    </div>
  );
}

function InfoSection({ title, icon, rows }) {
  return (
    <section className="rounded-2xl border border-border bg-bg-card p-5">
      <h2 className="font-semibold flex items-center gap-2"><span aria-hidden>{icon}</span>{title}</h2>
      <div className="mt-2">
        {rows.map((row) => <InfoRow key={row.label} {...row} />)}
      </div>
    </section>
  );
}

export default function DeviceInfo() {
  const t = useT();
  useDocTitle(t("device"));
  const [viewport, setViewport] = useState(() => `${window.innerWidth} × ${window.innerHeight}`);
  const [online, setOnline] = useState(navigator.onLine);
  const [extra, setExtra] = useState({ media: null, storage: null, architecture: null, model: null });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const refreshViewport = () => setViewport(`${window.innerWidth} × ${window.innerHeight}`);
    const refreshOnline = () => setOnline(navigator.onLine);
    window.addEventListener("resize", refreshViewport);
    window.addEventListener("online", refreshOnline);
    window.addEventListener("offline", refreshOnline);

    Promise.allSettled([
      navigator.mediaDevices?.enumerateDevices?.(),
      navigator.storage?.estimate?.(),
      navigator.userAgentData?.getHighEntropyValues?.(["architecture", "bitness", "model"]),
    ]).then(([mediaResult, storageResult, uaResult]) => {
      const devices = mediaResult.status === "fulfilled" ? mediaResult.value : [];
      const storage = storageResult.status === "fulfilled" ? storageResult.value : null;
      const ua = uaResult.status === "fulfilled" ? uaResult.value : null;
      setExtra({
        media: {
          cameras: devices.filter((item) => item.kind === "videoinput").length,
          microphones: devices.filter((item) => item.kind === "audioinput").length,
          speakers: devices.filter((item) => item.kind === "audiooutput").length,
        },
        storage,
        architecture: ua?.architecture ? `${ua.architecture}${ua.bitness ? ` (${ua.bitness}-bit)` : ""}` : null,
        model: ua?.model || null,
      });
    });

    return () => {
      window.removeEventListener("resize", refreshViewport);
      window.removeEventListener("online", refreshOnline);
      window.removeEventListener("offline", refreshOnline);
    };
  }, []);

  const sections = useMemo(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const storageUsage = extra.storage?.usage;
    const storageQuota = extra.storage?.quota;
    return [
      {
        title: t("diSystem"), icon: "💻", rows: [
          { label: t("diOs"), value: detectPlatform() },
          { label: t("diBrowser"), value: detectBrowser() },
          { label: t("diArchitecture"), value: extra.architecture || t("diUnavailable") },
          { label: t("diModel"), value: extra.model || t("diUnavailable") },
          { label: t("diCpu"), value: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} ${t("diThreads")}` : t("diUnavailable") },
          { label: t("diMemory"), value: navigator.deviceMemory ? `~${navigator.deviceMemory} GB` : t("diUnavailable") },
        ],
      },
      {
        title: t("diDisplay"), icon: "🖥️", rows: [
          { label: t("diResolution"), value: `${screen.width} × ${screen.height}` },
          { label: t("diViewport"), value: viewport },
          { label: t("diPixelRatio"), value: `${window.devicePixelRatio || 1}×` },
          { label: t("diColorDepth"), value: `${screen.colorDepth} bit` },
          { label: t("diOrientation"), value: screen.orientation?.type || t("diUnavailable") },
          { label: t("diTouch"), value: navigator.maxTouchPoints ? `${navigator.maxTouchPoints} ${t("diPoints")}` : t("diNoTouch") },
        ],
      },
      {
        title: t("diConnectivity"), icon: "🌐", rows: [
          { label: t("diOnline"), value: online ? t("diYes") : t("diNo") },
          { label: t("diConnection"), value: connection?.effectiveType?.toUpperCase() || t("diUnavailable") },
          { label: t("diDownlink"), value: connection?.downlink ? `~${connection.downlink} Mbps` : t("diUnavailable") },
          { label: t("diRtt"), value: Number.isFinite(connection?.rtt) ? `~${connection.rtt} ms` : t("diUnavailable") },
          { label: t("diDataSaver"), value: connection?.saveData ? t("diYes") : t("diNo") },
        ],
      },
      {
        title: t("diBrowserData"), icon: "🧭", rows: [
          { label: t("diLanguage"), value: navigator.languages?.join(", ") || navigator.language },
          { label: t("diTimezone"), value: Intl.DateTimeFormat().resolvedOptions().timeZone },
          { label: t("diCookies"), value: navigator.cookieEnabled ? t("diEnabled") : t("diDisabled") },
          { label: t("diStorage"), value: storageQuota ? `${formatBytes(storageUsage)} / ${formatBytes(storageQuota)}` : t("diUnavailable") },
          { label: t("diCameras"), value: extra.media ? extra.media.cameras : t("diUnavailable") },
          { label: t("diMicrophones"), value: extra.media ? extra.media.microphones : t("diUnavailable") },
          { label: t("diSpeakers"), value: extra.media ? extra.media.speakers : t("diUnavailable") },
        ],
      },
    ];
  }, [extra, online, t, viewport]);

  const copyReport = async () => {
    const report = sections.flatMap((section) => [section.title, ...section.rows.map((row) => `${row.label}: ${row.value}`), ""]).join("\n");
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">💻 {t("device")}</h1>
          <p className="mt-2 text-text-secondary max-w-2xl">{t("diIntro")}</p>
        </div>
        <button onClick={copyReport} className="px-4 py-2 rounded-xl bg-accent text-bg-primary font-medium hover:bg-accent-hover transition-colors shrink-0">
          {copied ? t("diCopied") : t("diCopy")}
        </button>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {sections.map((section) => <InfoSection key={section.title} {...section} />)}
      </div>
      <p className="mt-6 text-sm text-text-muted">🔒 {t("diPrivacy")}</p>
    </div>
  );
}
