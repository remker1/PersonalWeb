import { motion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { useExperiencesContent } from "../hooks/useContent";

export default function Experience() {
  const { t } = useLanguage();
  const { items } = useExperiencesContent();

  return (
    <section id="experience" className="py-24 px-6 bg-glass-section backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="text-3xl font-bold text-text-primary mb-2"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          {t.experience.heading}
        </motion.h2>
        <motion.div
          className="w-12 h-0.5 bg-accent mb-10"
          initial={{ scaleX: 0, originX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true, margin: "-100px" }}
        />

        <div className="space-y-8">
          {items.map((exp, i) => (
            <motion.div
              key={`exp-${exp.title}-${exp.id || i}`}
              className="relative pl-8 border-l-2 border-border"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              {/* Timeline dot */}
              <motion.div
                className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${
                  i === 0
                    ? "bg-accent border-accent"
                    : "bg-glass-section border-border"
                }`}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.2 + 0.2, type: "spring", stiffness: 300 }}
                viewport={{ once: true }}
              />

              <motion.div
                className="bg-glass-surface backdrop-blur-md border border-border rounded-lg p-6"
                whileHover={{ y: -3, borderColor: "var(--color-accent)" }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                  <h3 className="text-lg font-semibold text-text-primary">
                    {exp.title}
                  </h3>
                  <span className="text-xs text-text-muted font-medium uppercase tracking-wide">
                    {exp.period}
                  </span>
                </div>
                <p className="text-accent text-sm font-medium mb-3">
                  {exp.company}
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {exp.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
