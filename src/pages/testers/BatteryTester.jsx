import { useEffect, useMemo, useState } from "react";
import { useDocTitle, useT } from "./testersUtils";

const STORAGE_KEY = "pw_battery_healths";
const MAX_BATTERIES = 4;
const EMPTY_BATTERY = { full: "", design: "", cycles: "" };

const OS_COMMANDS = [
  { os: "Windows", icon: "🪟", stepsKey: "btStepsWindows", cmd: "powercfg /batteryreport" },
  { os: "macOS", icon: "🍎", stepsKey: "btStepsMac", cmd: "ioreg -rn AppleSmartBattery | grep -iE 'capacity|cycle'" },
  { os: "Linux", icon: "🐧", stepsKey: "btStepsLinux", cmd: "grep -iE 'full|cycle' /sys/class/power_supply/BAT*/uevent" },
];

function detectOs() {
  const p = `${navigator.platform || ""} ${navigator.userAgent || ""}`;
  if (/Win/i.test(p)) return "Windows";
  if (/Mac/i.test(p)) return "macOS";
  if (/Linux|X11/i.test(p)) return "Linux";
  return null;
}

function formatDuration(seconds, t) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours && minutes) return `${hours}${t("btHour")} ${minutes}${t("btMinute")}`;
  if (hours) return `${hours}${t("btHour")}`;
  return `${minutes}${t("btMinute")}`;
}

/* ── parsers for system output (all local, nothing uploaded) ── */

// macOS: ioreg -rn AppleSmartBattery
function parseIoreg(text) {
  if (!/"DesignCapacity"/.test(text)) return null;
  const num = (re) => {
    const m = text.match(re);
    return m ? Number(m[1]) : null;
  };
  const design = num(/"DesignCapacity"\s*=\s*(\d+)/);
  let full = num(/"AppleRawMaxCapacity"\s*=\s*(\d+)/);
  const maxCap = num(/"MaxCapacity"\s*=\s*(\d+)/);
  if (full == null && maxCap != null && maxCap > 200) full = maxCap; // Intel Macs: MaxCapacity is mAh, Apple Silicon: a percentage
  const cycles = num(/"CycleCount"\s*=\s*(\d+)/);
  if (!(design > 0) || !(full > 0)) return null;
  return [{ full: String(full), design: String(design), cycles: cycles != null ? String(cycles) : "" }];
}

// Linux: /sys/class/power_supply/BAT*/uevent (grep output may prefix each line with the file path)
function parseUevent(text) {
  if (!/POWER_SUPPLY_/i.test(text)) return null;
  const groups = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/(?:(BAT\d+)[^:=]*:)?\s*POWER_SUPPLY_(ENERGY_FULL_DESIGN|ENERGY_FULL|CHARGE_FULL_DESIGN|CHARGE_FULL|CYCLE_COUNT)=(\d+)/i);
    if (!m) continue;
    const key = m[1] || "BAT0";
    (groups[key] ||= {})[m[2].toUpperCase()] = m[3];
  }
  const out = Object.keys(groups)
    .sort()
    .map((k) => {
      const g = groups[k];
      return {
        full: g.ENERGY_FULL || g.CHARGE_FULL || "",
        design: g.ENERGY_FULL_DESIGN || g.CHARGE_FULL_DESIGN || "",
        cycles: g.CYCLE_COUNT || "",
      };
    })
    .filter((b) => b.full && b.design);
  return out.length ? out : null;
}

// Windows: battery-report.html from `powercfg /batteryreport` (multi-battery: one column per battery)
function parsePowercfg(text) {
  if (!/DESIGN CAPACITY/i.test(text)) return null;
  const rowValues = (label) => {
    const doc = new DOMParser().parseFromString(text, "text/html");
    for (const row of doc.querySelectorAll("tr")) {
      const cells = [...row.querySelectorAll("th, td")];
      if (cells.length >= 2 && cells[0].textContent.trim().toUpperCase().startsWith(label)) {
        return cells.slice(1).map((c) => {
          const m = c.textContent.replace(/[,\s\u00a0\u202f]/g, "").match(/(\d+)/);
          return m ? m[1] : "";
        });
      }
    }
    // plain-text fallback (user copied the rendered report instead of the file)
    const line = text.match(new RegExp(label + "([^\\n]*)", "i"));
    return line ? [...line[1].matchAll(/([\d,.\s\u00a0\u202f]{3,})m[WA]h/gi)].map((m) => m[1].replace(/[^\d]/g, "")) : [];
  };
  const designs = rowValues("DESIGN CAPACITY");
  const fulls = rowValues("FULL CHARGE CAPACITY");
  const cycles = rowValues("CYCLE COUNT");
  const n = Math.min(designs.length, fulls.length);
  const out = Array.from({ length: n }, (_, i) => ({
    full: fulls[i] || "",
    design: designs[i] || "",
    cycles: cycles[i] || "",
  })).filter((b) => Number(b.full) > 0 && Number(b.design) > 0);
  return out.length ? out : null;
}

function parseSystemOutput(text) {
  return parseIoreg(text) || parseUevent(text) || parsePowercfg(text);
}

function healthOf({ full, design }) {
  const f = Number(full);
  const d = Number(design);
  if (!(f > 0) || !(d > 0)) return null;
  return Math.round((f / d) * 100);
}

function stateOf(health) {
  return health == null ? null : health >= 80 ? "Good" : health >= 60 ? "Worn" : "Service";
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card px-4 py-3">
      <div className="text-xs text-text-muted">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export default function BatteryTester() {
  const t = useT();
  useDocTitle(t("battery"));

  const [supported, setSupported] = useState(() =>
    typeof navigator !== "undefined" && typeof navigator.getBattery === "function" ? null : false,
  );
  const [battery, setBattery] = useState(null);
  const [batteries, setBatteries] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length) return saved.slice(0, MAX_BATTERIES);
    } catch { /* corrupt or missing — start fresh */ }
    return [{ ...EMPTY_BATTERY }];
  });
  const [copied, setCopied] = useState(null);
  const [rawInput, setRawInput] = useState("");
  const [autoStatus, setAutoStatus] = useState(null); // { ok: boolean, n?: number }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(batteries));
  }, [batteries]);

  const setField = (index, field, value) => {
    setBatteries((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  };

  const copyCmd = async (cmd) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(cmd);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const importText = (text) => {
    setRawInput(text);
    if (!text.trim()) {
      setAutoStatus(null);
      return;
    }
    const parsed = parseSystemOutput(text);
    if (parsed) {
      setBatteries(parsed.slice(0, MAX_BATTERIES));
      setAutoStatus({ ok: true, n: Math.min(parsed.length, MAX_BATTERIES) });
    } else {
      setAutoStatus({ ok: false });
    }
  };

  const importFile = async (file) => {
    if (!file) return;
    importText(await file.text());
  };

  useEffect(() => {
    if (typeof navigator.getBattery !== "function") {
      return undefined;
    }

    let manager;
    let active = true;
    const update = () => {
      if (!active || !manager) return;
      setBattery({
        level: manager.level,
        charging: manager.charging,
        chargingTime: manager.chargingTime,
        dischargingTime: manager.dischargingTime,
      });
    };

    navigator.getBattery().then((result) => {
      if (!active) return;
      manager = result;
      setSupported(true);
      update();
      ["levelchange", "chargingchange", "chargingtimechange", "dischargingtimechange"].forEach((event) =>
        manager.addEventListener(event, update),
      );
    }).catch(() => setSupported(false));

    return () => {
      active = false;
      if (!manager) return;
      ["levelchange", "chargingchange", "chargingtimechange", "dischargingtimechange"].forEach((event) =>
        manager.removeEventListener(event, update),
      );
    };
  }, []);

  const healths = useMemo(() => batteries.map(healthOf), [batteries]);
  const os = useMemo(() => detectOs(), []);
  const primaryCmd = OS_COMMANDS.find((c) => c.os === os);
  const otherCmds = OS_COMMANDS.filter((c) => c.os !== os);
  const level = battery ? Math.round(battery.level * 100) : null;
  const remaining = battery?.charging
    ? formatDuration(battery.chargingTime, t)
    : formatDuration(battery?.dischargingTime, t);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">🔋 {t("battery")}</h1>
      <p className="text-sm text-text-muted mb-6">{t("btIntro")}</p>

      {supported === false && (
        <div className="rounded-2xl border border-amber-400/50 bg-amber-400/10 p-5 mb-6">
          <h2 className="font-semibold text-amber-600 dark:text-amber-400">{t("btUnsupportedTitle")}</h2>
          <p className="text-sm text-text-secondary mt-1">{t("btUnsupported")}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Metric label={t("btLevel")} value={level == null ? "—" : `${level}%`} />
        <Metric
          label={t("btStatus")}
          value={battery ? (battery.charging ? t("btCharging") : t("btDischarging")) : "—"}
        />
        <Metric label={battery?.charging ? t("btUntilFull") : t("btRemaining")} value={remaining} />
        <Metric label={t("btApi")} value={supported == null ? "…" : supported ? t("btAvailable") : t("btUnavailable")} />
      </div>

      {battery && (
        <div className="rounded-2xl border border-border bg-bg-card p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 flex-1 max-w-md rounded-xl border-2 border-text-muted/50 p-1" role="img" aria-label={`${level}%`}>
              <div
                className={`h-full rounded-lg transition-all duration-500 ${level <= 20 ? "bg-red-500" : "bg-accent"}`}
                style={{ width: `${level}%` }}
              />
            </div>
            <span className="text-3xl font-bold tabular-nums">{level}%</span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-bg-card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <h2 className="text-lg font-semibold">{t("btHealthTitle")}</h2>
            <p className="text-sm text-text-muted mt-1">{t("btHealthDesc")}</p>
          </div>
          {batteries.length < MAX_BATTERIES && (
            <button
              onClick={() => setBatteries((prev) => [...prev, { ...EMPTY_BATTERY }])}
              className="px-3 py-1.5 rounded-full text-sm border border-border text-text-secondary hover:bg-bg-secondary transition-colors"
            >
              + {t("btAddBattery")}
            </button>
          )}
        </div>

        <div
          className="mt-5 rounded-xl border-2 border-dashed border-border p-4 transition-colors focus-within:border-accent/60"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) importFile(file);
            else importText(e.dataTransfer.getData("text"));
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium mr-auto">⚡ {t("btAutoTitle")}</p>
            <label className="px-3 py-1.5 rounded-full text-sm border border-border text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer">
              {t("btAutoFile")}
              <input
                type="file"
                accept=".html,.htm,.txt"
                className="hidden"
                onChange={(e) => {
                  importFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="text-xs text-text-muted mt-1">{t("btAutoHint")}</p>
          <textarea
            value={rawInput}
            onChange={(e) => importText(e.target.value)}
            rows={3}
            spellCheck={false}
            placeholder={t("btAutoPlaceholder")}
            className="mt-3 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 font-mono text-xs text-text-primary outline-none focus:border-accent resize-y"
          />
          {autoStatus && (
            <p className={`text-sm mt-2 ${autoStatus.ok ? "text-green-500" : "text-amber-500"}`}>
              {autoStatus.ok
                ? `✓ ${t("btAutoOk").replace("{n}", autoStatus.n)}`
                : t("btAutoFail")}
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 mt-5">
          {batteries.map((b, i) => {
            const health = healths[i];
            const state = stateOf(health);
            const cycles = Number(b.cycles);
            return (
              <div key={i} className="rounded-xl border border-border bg-bg-secondary/50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-semibold mr-auto">
                    🔋 {t("btBattery")} {i + 1}
                  </h3>
                  {health != null && (
                    <div className={`text-right ${state === "Good" ? "text-green-500" : state === "Worn" ? "text-amber-500" : "text-red-500"}`}>
                      <span className="text-2xl font-bold tabular-nums">{health}%</span>
                      <span className="ml-2 text-sm font-medium">{t(`btHealth${state}`)}</span>
                    </div>
                  )}
                  {batteries.length > 1 && (
                    <button
                      onClick={() => setBatteries((prev) => prev.filter((_, j) => j !== i))}
                      className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-text-muted hover:bg-bg-secondary transition-colors"
                      aria-label={t("btRemove")}
                      title={t("btRemove")}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-xs text-text-secondary">
                    {t("btFullCapacity")}
                    <input
                      type="number"
                      min="1"
                      inputMode="decimal"
                      value={b.full}
                      onChange={(e) => setField(i, "full", e.target.value)}
                      placeholder="42500"
                      className="mt-1.5 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                    />
                  </label>
                  <label className="text-xs text-text-secondary">
                    {t("btDesignCapacity")}
                    <input
                      type="number"
                      min="1"
                      inputMode="decimal"
                      value={b.design}
                      onChange={(e) => setField(i, "design", e.target.value)}
                      placeholder="50000"
                      className="mt-1.5 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                    />
                  </label>
                  <label className="text-xs text-text-secondary">
                    {t("btCycles")}
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={b.cycles}
                      onChange={(e) => setField(i, "cycles", e.target.value)}
                      placeholder="—"
                      className="mt-1.5 w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                    />
                  </label>
                </div>
                {health != null && health > 105 && (
                  <p className="text-xs text-amber-500 mt-3">{t("btCheckValues")}</p>
                )}
                {cycles > 0 && (
                  <p className="text-xs text-text-muted mt-3">
                    {t("btCyclesNote")}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-sm text-text-muted mt-4">{t("btFormula")}</p>

        {primaryCmd && (
          <div className="mt-5 rounded-xl border border-accent/40 bg-accent/5 p-4">
            <p className="text-sm">
              <span className="mr-1.5" aria-hidden>{primaryCmd.icon}</span>
              <strong>{t("btDetected")} {primaryCmd.os}</strong>
              <span className="text-text-secondary"> — {t(primaryCmd.stepsKey)}</span>
            </p>
            <button
              onClick={() => copyCmd(primaryCmd.cmd)}
              className="mt-3 w-full text-left font-mono text-xs px-3 py-2 rounded-lg border border-border bg-bg-primary hover:border-accent/60 transition-colors break-all"
              title={t("btCopy")}
            >
              {copied === primaryCmd.cmd ? `✓ ${t("btCopied")}` : `$ ${primaryCmd.cmd}`}
            </button>
          </div>
        )}

        <details className="mt-4 border-t border-border pt-4">
          <summary className="cursor-pointer text-sm font-medium text-accent">{t("btFindValues")}</summary>
          <div className="mt-3 grid gap-4 text-sm text-text-muted lg:grid-cols-2">
            {(primaryCmd ? otherCmds : OS_COMMANDS).map(({ os: name, icon, stepsKey, cmd }) => (
              <div key={name}>
                <p>
                  <span className="mr-1" aria-hidden>{icon}</span>
                  <strong className="text-text-secondary">{name}:</strong> {t(stepsKey)}
                </p>
                <button
                  onClick={() => copyCmd(cmd)}
                  className="mt-2 w-full text-left font-mono text-xs px-3 py-2 rounded-lg border border-border bg-bg-secondary hover:border-accent/60 transition-colors break-all"
                  title={t("btCopy")}
                >
                  {copied === cmd ? `✓ ${t("btCopied")}` : `$ ${cmd}`}
                </button>
              </div>
            ))}
          </div>
        </details>
      </div>

      <p className="text-xs text-text-muted mt-6">💡 {t("btDisclaimer")}</p>
    </div>
  );
}
