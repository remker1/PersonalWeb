import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import AnimatedBackground from "../components/AnimatedBackground";
import { galleryPhotos } from "../data/photos";
import { usePhotosContent } from "../hooks/useContent";

export default function PhotographyGallery() {
  const { t } = useLanguage();
  const { items, usingDb } = usePhotosContent();
  const [photoSizes, setPhotoSizes] = useState({});
  const [activeIndex, setActiveIndex] = useState(null);

  const allPhotos = useMemo(
    () =>
      usingDb
        ? items.map((p) => ({ id: p.id, src: p.url, alt: p.alt || "Photo" }))
        : [
            ...galleryPhotos,
            ...items.map((p) => ({ id: p.id, src: p.url, alt: p.alt || "Photo" })),
          ],
    [items, usingDb]
  );

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
        <a
          href="/"
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
        </a>

        <h1 className="text-4xl font-bold text-text-primary mb-2">
          {t.gallery.heading}
        </h1>
        <p className="text-text-secondary max-w-xl mb-12">
          {t.gallery.description}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {arrangedPhotos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="aspect-square bg-glass-surface backdrop-blur-md border border-border rounded-lg overflow-hidden hover:border-text-muted transition-colors"
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setActiveIndex(null)}
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
          <img
            src={activePhoto.src}
            alt={activePhoto.alt}
            className="max-h-[92vh] max-w-[94vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
