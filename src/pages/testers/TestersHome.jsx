import { Link } from "react-router-dom";
import { tPath, useT, useDocTitle } from "./testersUtils";

const CARDS = [
  { path: "/keyboard", titleKey: "keyboard", descKey: "keyboardDesc", icon: "⌨️" },
  { path: "/trackpad", titleKey: "mouse", descKey: "mouseDesc", icon: "🖐️" },
  { path: "/webcam", titleKey: "webcam", descKey: "webcamDesc", icon: "📷" },
  { path: "/audio", titleKey: "audio", descKey: "audioDesc", icon: "🔊" },
  { path: "/screen", titleKey: "screen", descKey: "screenDesc", icon: "🖥️" },
  { path: "/touch", titleKey: "touch", descKey: "touchDesc", icon: "👆" },
  { path: "/battery", titleKey: "battery", descKey: "batteryDesc", icon: "🔋" },
  { path: "/network", titleKey: "network", descKey: "networkDesc", icon: "🌐" },
  { path: "/contact", titleKey: "contactDeveloper", descKey: "contactDeveloperDesc", icon: "✉️" },
];

export default function TestersHome() {
  const t = useT();
  useDocTitle(t("siteTitle"));

  return (
    <div>
      <div className="text-center mt-6 mb-12">
        <h1 className="text-4xl font-bold tracking-tight">{t("siteTitle")}</h1>
        <p className="mt-3 text-text-secondary max-w-2xl mx-auto">{t("tagline")}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.path}
            to={tPath(card.path)}
            className="group rounded-2xl border border-border bg-bg-card p-6 flex flex-col transition-all hover:border-accent hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl" aria-hidden>{card.icon}</div>
            <h2 className="mt-4 text-lg font-semibold">{t(card.titleKey)}</h2>
            <p className="mt-2 text-sm text-text-muted flex-1">{t(card.descKey)}</p>
            <span className="mt-4 text-sm font-medium text-accent group-hover:text-accent-hover">
              {t("open")} →
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-text-muted max-w-xl mx-auto">
        🔒 {t("privacy")}
      </p>
    </div>
  );
}
