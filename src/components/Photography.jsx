import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { featuredPhotos } from "../data/photos";
import { usePhotosContent } from "../hooks/useContent";

export default function Photography() {
  const { t } = useLanguage();
  const { items } = usePhotosContent();
  const localIds = new Set(featuredPhotos.map((p) => p.id));
  const extras = items
    .filter((p) => !localIds.has(p.id))
    .map((p) => ({ id: p.id, src: p.url, alt: p.alt || "Photo" }));
  const allPhotos = [...featuredPhotos, ...extras];

  return (
    <section id="photography" className="py-24 px-6 bg-glass-section backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="text-3xl font-bold text-text-primary mb-2"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          {t.photography.heading}
        </motion.h2>
        <motion.div
          className="w-12 h-0.5 bg-accent mb-4"
          initial={{ scaleX: 0, originX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true, margin: "-100px" }}
        />
        <motion.p
          className="text-text-secondary mb-10 max-w-xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {t.photography.description}
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {allPhotos.slice(0, 8).map((photo, i) => (
            <motion.div
              key={`photo-${photo.id}`}
              className="aspect-square bg-glass-surface backdrop-blur-md border border-border rounded-lg overflow-hidden group"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ scale: 1.05, borderColor: "var(--color-text-muted)" }}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Link
            to="/photography"
            className="inline-flex items-center gap-2 px-6 py-3 border border-border hover:border-text-muted text-text-secondary hover:text-text-primary text-sm font-medium rounded-lg transition-colors"
          >
            {t.photography.viewGallery}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
