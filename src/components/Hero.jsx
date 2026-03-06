import { motion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-3xl text-center">
        <motion.p
          className="text-accent text-sm font-medium tracking-wide uppercase mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {t.hero.greeting}
        </motion.p>
        <motion.h1
          className="text-5xl md:text-7xl font-bold text-text-primary mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {t.hero.name}
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl text-text-secondary mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {t.hero.title}
        </motion.p>
        <motion.p
          className="text-text-muted max-w-xl mx-auto mb-12 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {t.hero.description}
        </motion.p>
        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
        >
          <a
            href="#projects"
            className="px-6 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t.hero.viewWork}
          </a>
          <a
            href="#contact"
            className="px-6 py-3 border border-border hover:border-text-muted text-text-secondary hover:text-text-primary text-sm font-medium rounded-lg transition-colors"
          >
            {t.hero.getInTouch}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
