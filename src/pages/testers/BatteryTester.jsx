import { useEffect, useMemo, useState } from "react";
import { useDocTitle, useT } from "./testersUtils";

function formatDuration(seconds, t) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours && minutes) return `${hours}${t("btHour")} ${minutes}${t("btMinute")}`;
  if (hours) return `${hours}${t("btHour")}`;
  return `${minutes}${t("btMinute")}`;
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
  const [fullCapacity, setFullCapacity] = useState("");
  const [designCapacity, setDesignCapacity] = useState("");

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

  const health = useMemo(() => {
    const full = Number(fullCapacity);
    const design = Number(designCapacity);
    if (!(full > 0) || !(design > 0)) return null;
    return Math.round((full / design) * 100);
  }, [fullCapacity, designCapacity]);

  const healthState = health == null ? null : health >= 80 ? "good" : health >= 60 ? "worn" : "service";
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
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-64">
            <h2 className="text-lg font-semibold">{t("btHealthTitle")}</h2>
            <p className="text-sm text-text-muted mt-1">{t("btHealthDesc")}</p>
          </div>
          {health != null && (
            <div className={`text-right ${healthState === "good" ? "text-green-500" : healthState === "worn" ? "text-amber-500" : "text-red-500"}`}>
              <div className="text-3xl font-bold tabular-nums">{health}%</div>
              <div className="text-sm font-medium">{t(`btHealth${healthState[0].toUpperCase()}${healthState.slice(1)}`)}</div>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mt-5">
          <label className="text-sm text-text-secondary">
            {t("btFullCapacity")}
            <input
              type="number"
              min="1"
              inputMode="decimal"
              value={fullCapacity}
              onChange={(event) => setFullCapacity(event.target.value)}
              placeholder="e.g. 42500"
              className="mt-1.5 w-full rounded-xl border border-border bg-bg-secondary px-3 py-2 text-text-primary outline-none focus:border-accent"
            />
          </label>
          <label className="text-sm text-text-secondary">
            {t("btDesignCapacity")}
            <input
              type="number"
              min="1"
              inputMode="decimal"
              value={designCapacity}
              onChange={(event) => setDesignCapacity(event.target.value)}
              placeholder="e.g. 50000"
              className="mt-1.5 w-full rounded-xl border border-border bg-bg-secondary px-3 py-2 text-text-primary outline-none focus:border-accent"
            />
          </label>
        </div>

        {health == null && <p className="text-sm text-text-muted mt-4">{t("btFormula")}</p>}
        {health != null && health > 105 && <p className="text-sm text-amber-500 mt-4">{t("btCheckValues")}</p>}

        <details className="mt-5 border-t border-border pt-4">
          <summary className="cursor-pointer text-sm font-medium text-accent">{t("btFindValues")}</summary>
          <div className="mt-3 grid gap-3 text-sm text-text-muted sm:grid-cols-3">
            <p><strong className="text-text-secondary">macOS:</strong> {t("btMac")}</p>
            <p><strong className="text-text-secondary">Windows:</strong> {t("btWindows")}</p>
            <p><strong className="text-text-secondary">Linux:</strong> {t("btLinux")}</p>
          </div>
        </details>
      </div>

      <p className="text-xs text-text-muted mt-6">💡 {t("btDisclaimer")}</p>
    </div>
  );
}
