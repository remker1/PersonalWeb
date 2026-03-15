import { motion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { useProjectsContent } from "../hooks/useContent";
import translations from "../data/translations";

const projectLinks = [
  { github: "https://git.cs.usask.ca/xpo285/cmpt370-g29", live: "#" },
  { github: "https://github.com/remker1/USask-GPA-Calculator", live: "#" },
];

export default function Projects() {
  const { t } = useLanguage();
  const { items } = useProjectsContent();
  // Always show translated projects first; append only DB items whose titles
  // don't already exist in the translations (dedup against all languages).
  const translatedTitles = new Set(
    Object.values(translations).flatMap((tr) => tr.projects.items.map((p) => p.title))
  );
  const extras = items.filter((p) => !translatedTitles.has(p.title));
  const allItems = [
    ...t.projects.items.map((p, i) => ({ ...p, github: projectLinks[i]?.github, live: projectLinks[i]?.live })),
    ...extras,
  ];

  return (
    <section id="projects" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="text-3xl font-bold text-text-primary mb-2"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          {t.projects.heading}
        </motion.h2>
        <motion.div
          className="w-12 h-0.5 bg-accent mb-10"
          initial={{ scaleX: 0, originX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true, margin: "-100px" }}
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allItems.map((project, i) => (
            <motion.div
              key={`proj-${project.title}`}
              className="bg-glass-surface backdrop-blur-md border border-border rounded-lg p-6 group"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -8, borderColor: "var(--color-text-muted)" }}
            >
              {/* Folder icon */}
              <div className="flex items-center justify-between mb-4">
                <svg
                  className="w-8 h-8 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <div className="flex items-center gap-3">
                  <a
                    href={project.github || "#"}
                    className="text-text-muted hover:text-text-primary transition-colors"
                    aria-label="GitHub"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {i === 0 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.65 14.39 19.49 4.67a.82.82 0 0 0-1.56 0l-2.7 8.29H8.77l-2.7-8.29a.82.82 0 0 0-1.56 0L1.35 14.39a1.61 1.61 0 0 0 .59 1.8L12 23.5l10.06-7.31a1.61 1.61 0 0 0 .59-1.8Z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    )}
                  </a>
                  <a
                    href={project.live || "#"}
                    className="text-text-muted hover:text-text-primary transition-colors"
                    aria-label="Live demo"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-accent transition-colors">
                {project.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-text-muted font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
