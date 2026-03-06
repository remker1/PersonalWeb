import { motion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

const skills = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "SQL",
  "Git",
  "HTML/CSS",
  "REST APIs",
  "Linux",
  "Docker",
];

export default function About() {
  const { t } = useLanguage();

  return (
    <section id="about" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="text-3xl font-bold text-text-primary mb-2"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          {t.about.heading}
        </motion.h2>
        <motion.div
          className="w-12 h-0.5 bg-accent mb-10"
          initial={{ scaleX: 0, originX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true, margin: "-100px" }}
        />

        <div className="grid md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <p className="text-text-secondary leading-relaxed mb-4">
              {t.about.bio1}
              <span className="text-text-primary">{t.about.university}</span>
              {t.about.bio1End}
            </p>
            <p className="text-text-secondary leading-relaxed">
              {t.about.bio2}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-4">
              {t.about.techHeading}
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <motion.span
                  key={skill}
                  className="px-3 py-1 text-xs font-medium text-text-secondary bg-bg-card border border-border rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.1, y: -2 }}
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
