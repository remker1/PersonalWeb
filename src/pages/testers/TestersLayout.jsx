import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { tPath, useT } from "./testersUtils";

const NAV_ITEMS = [
  { path: "/keyboard", key: "keyboard", icon: "⌨️" },
  { path: "/mouse", key: "mouse", icon: "🖱️" },
  { path: "/webcam", key: "webcam", icon: "📷" },
  { path: "/audio", key: "audio", icon: "🔊" },
  { path: "/screen", key: "screen", icon: "🖥️" },
  { path: "/touch", key: "touch", icon: "👆" },
  { path: "/cpu", key: "cpu", icon: "⚙️" },
  { path: "/gpu", key: "gpu", icon: "🎮" },
];

export function TestersLayout({ children }) {
  const t = useT();
  const { lang, setLang, languageNames } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border bg-glass-section backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
          <Link to={tPath("") || "/"} className="font-semibold tracking-tight shrink-0">
            <span className="text-accent">testers</span>
            <span className="text-text-muted">.remker1.dev</span>
          </Link>
          <nav className="ml-4 flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const to = tPath(item.path);
              const active = location.pathname === to;
              return (
                <Link
                  key={item.path}
                  to={to}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    active
                      ? "bg-accent text-bg-primary font-medium"
                      : "text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  <span className="mr-1" aria-hidden>{item.icon}</span>
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="px-2 py-1 rounded-md text-sm border border-border bg-bg-card text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer"
              aria-label="Language"
            >
              {Object.entries(languageNames).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            <button
              onClick={toggleTheme}
              className="px-2 py-1 rounded-md text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
              title="Theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">{children}</main>

      <footer className="border-t border-border py-6 text-center text-sm text-text-muted px-4">
        <p>{t("privacy")}</p>
        <p className="mt-2">
          <a href="https://remker1.dev" className="text-accent hover:text-accent-hover">
            {t("backToSite")}
          </a>
        </p>
      </footer>
    </div>
  );
}
