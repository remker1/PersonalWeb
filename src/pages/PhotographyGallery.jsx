import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import AnimatedBackground from "../components/AnimatedBackground";
import { galleryPhotos } from "../data/photos";
import { usePhotosContent } from "../hooks/useContent";

export default function PhotographyGallery() {
  const { t } = useLanguage();
  const { items } = usePhotosContent();
  const [photoSizes, setPhotoSizes] = useState({});
  const [activeIndex, setActiveIndex] = useState(null);

  const allPhotos = useMemo(() => {
    const localIds = new Set(galleryPhotos.map((p) => p.id));
    const extras = items
      .filter((p) => !localIds.has(p.id))
      .map((p) => ({ id: p.id, src: p.url, alt: p.alt || "Photo" }));
    return [...galleryPhotos, ...extras];
  }, [items]);

  useEffect(() => {
    let cancelled = false;

    allPhotos.forEach((photo) => {
      const img = new Image();
      img.src = photo.src;
      img.onload = () => {
        if (cancelled) return;
        setPhotoSizes((prev) => ({
          ...prev,
          [photo.id]: {
            width: img.naturalWidth,
            height: img.naturalHeight,
            ratio: img.naturalWidth / img.naturalHeight,
            area: img.naturalWidth * img.naturalHeight,
          },
        }));
      };
    });

    return () => {
      cancelled = true;
    };
  }, [allPhotos]);

  const arrangedPhotos = useMemo(() => {
    return [...allPhotos].sort((a, b) => {
      const aArea = photoSizes[a.id]?.area || 0;
      const bArea = photoSizes[b.id]?.area || 0;
      return bArea - aArea;
    });
  }, [allPhotos, photoSizes]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((prev) =>
          prev === null ? prev : (prev - 1 + arrangedPhotos.length) % arrangedPhotos.length
        );
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((prev) =>
          prev === null ? prev : (prev + 1) % arrangedPhotos.length
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [arrangedPhotos.length]);

  const activePhoto = activeIndex === null ? null : arrangedPhotos[activeIndex];

  const showPrev = () =>
    setActiveIndex((prev) =>
      prev === null ? prev : (prev - 1 + arrangedPhotos.length) % arrangedPhotos.length
    );
  const showNext = () =>
    setActiveIndex((prev) =>
      prev === null ? prev : (prev + 1) % arrangedPhotos.length
    );

  return (
    <div className="min-h-screen bg-bg-primary">
      <AnimatedBackground />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
          >
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
                d="M7 16l-4-4m0 0l4-4m-4 4h18"
              />
            </svg>
            {t.gallery.backHome}
          </Link>
        </motion.div>

        <motion.h1
          className="text-4xl font-bold text-text-primary mb-2"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {t.gallery.heading}
        </motion.h1>
        <motion.p
          className="text-text-secondary max-w-xl mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {t.gallery.description}
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {arrangedPhotos.map((photo, index) => (
            <motion.button
              key={`gal-${photo.id}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="aspect-square bg-glass-surface backdrop-blur-md border border-border rounded-lg overflow-hidden hover:border-text-muted transition-colors"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
              whileHover={{ scale: 1.03 }}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activePhoto && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center"
            onClick={() => setActiveIndex(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              className="absolute top-5 right-5 text-white/90 hover:text-white text-3xl leading-none"
              aria-label="Close image preview"
              onClick={() => setActiveIndex(null)}
            >
              ×
            </button>
            <button
              type="button"
              className="absolute left-4 md:left-8 text-white/90 hover:text-white text-4xl leading-none px-3 py-1"
              aria-label="Previous image"
              onClick={(event) => {
                event.stopPropagation();
                showPrev();
              }}
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute right-4 md:right-8 text-white/90 hover:text-white text-4xl leading-none px-3 py-1"
              aria-label="Next image"
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
            >
              ›
            </button>
            <motion.img
              key={activePhoto.id}
              src={activePhoto.src}
              alt={activePhoto.alt}
              className="max-h-[92vh] max-w-[94vw] object-contain"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
