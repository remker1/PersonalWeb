const photoModules = import.meta.glob(
  "../assets/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}",
  { eager: true, import: "default" }
);

const allPhotos = Object.entries(photoModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, src], index) => {
    const filename = path.split("/").pop() || `Photo ${index + 1}`;
    return {
      id: index + 1,
      src,
      alt: filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
    };
  });

export const featuredPhotos = allPhotos.slice(0, 8);

export const galleryPhotos = allPhotos;
