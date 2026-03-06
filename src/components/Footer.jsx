import { motion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

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
          <p className="text-text-muted text-xs">{t.footer.builtWith}</p>
        </div>
      </div>
    </motion.footer>
  );
}
