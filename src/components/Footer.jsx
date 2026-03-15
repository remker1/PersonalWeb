import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function Footer() {
  const { t, lang } = useLanguage();
  const now = useCurrentTime();
  const locale = lang === "zh" ? "zh-CN" : lang === "fr" ? "fr-FR" : "en-US";

  return (
    <motion.footer
      className="py-8 px-6 border-t border-border"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm">
            &copy; {new Date().getFullYear()} remker1. {t.footer.rights}
          </p>
          <p className="text-text-muted text-xs font-mono">
            {now.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" })}
            {" \u00B7 "}
            {now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <p className="text-text-muted text-xs">{t.footer.builtWith}</p>
        </div>
      </div>
    </motion.footer>
  );
}
