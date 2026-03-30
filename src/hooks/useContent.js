import { useState, useEffect } from "react";
import {
  getExperiences,
  getProjects,
  getPhotos,
} from "../api";
import {
  getExtraExperiences,
  getExtraProjects,
  getExtraPhotos,
} from "../data/dynamicContent";

/**
 * Merge localStorage items with API items.
 * localStorage items win when they share the same id or title.
 */
function mergeLocalAndDb(localItems, dbItems = []) {
  if (!dbItems || dbItems.length === 0) return localItems;
  const localById = new Map();
  const localByTitle = new Map();
  localItems.forEach((item) => {
    if (item.id != null) localById.set(Number(item.id), item);
    if (item.title) localByTitle.set(item.title, item);
  });
  const extras = [];
  dbItems.forEach((db) => {
    const id = db.id != null ? Number(db.id) : null;
    if ((id != null && localById.has(id)) || (db.title && localByTitle.has(db.title))) return;
    extras.push(db);
  });
  return [...localItems, ...extras];
}

export function useExperiencesContent() {
  const [items, setItems] = useState(() => getExtraExperiences());
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const onStorage = () => setItems(getExtraExperiences());
    window.addEventListener("storage", onStorage);

    getExperiences()
      .then((data) => {
        if (data && data.length > 0) {
          const local = getExtraExperiences();
          setItems(local.length > 0 ? mergeLocalAndDb(local, data) : data);
        }
        setHasFetched(true);
      })
      .catch(() => setHasFetched(true));
    return () => window.removeEventListener("storage", onStorage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasServerData = hasFetched && items.length > 0;
  return { items, hasServerData };
}

export function useProjectsContent() {
  const [items, setItems] = useState(() => getExtraProjects());
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const onStorage = () => setItems(getExtraProjects());
    window.addEventListener("storage", onStorage);

    getProjects()
      .then((data) => {
        if (data && data.length > 0) {
          const local = getExtraProjects();
          setItems(local.length > 0 ? mergeLocalAndDb(local, data) : data);
        }
        setHasFetched(true);
      })
      .catch(() => setHasFetched(true));
    return () => window.removeEventListener("storage", onStorage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasServerData = hasFetched && items.length > 0;
  return { items, hasServerData };
}

export function usePhotosContent() {
  const [items, setItems] = useState(() => getExtraPhotos());
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const onStorage = () => setItems(getExtraPhotos());
    window.addEventListener("storage", onStorage);

    getPhotos()
      .then((data) => {
        if (data && data.length > 0) {
          const local = getExtraPhotos();
          setItems(local.length > 0 ? mergeLocalAndDb(local, data) : data);
        }
        setHasFetched(true);
      })
      .catch(() => setHasFetched(true));
    return () => window.removeEventListener("storage", onStorage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasServerData = hasFetched && items.length > 0;
  return { items, hasServerData };
}
