import { useState, useEffect } from "react";
import {
  getExperiences,
  getProjects,
  getPhotos,
} from "../api";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  getExtraExperiences,
  getExtraProjects,
  getExtraPhotos,
} from "../data/dynamicContent";

/**
 * Merge localStorage items with DB items.
 * localStorage items win when they share the same id or title (they may have
 * multilingual fields that the DB rows don't). DB-only items are appended.
 */
function mergeDbAndLocal(localItems, dbItems = []) {
  if (!dbItems || dbItems.length === 0) return localItems;
  const localById = new Map();
  const localByTitle = new Map();
  localItems.forEach((item) => {
    if (item.id != null) localById.set(Number(item.id), item);
    const title = item.en?.title || item.title;
    if (title) localByTitle.set(title, item);
  });
  const extras = [];
  dbItems.forEach((db) => {
    const id = db.id != null ? Number(db.id) : null;
    const title = db.en?.title || db.title;
    if ((id != null && localById.has(id)) || (title && localByTitle.has(title))) return;
    extras.push(db);
  });
  return [...localItems, ...extras];
}

export function useExperiencesContent() {
  const usingDb = isSupabaseConfigured();
  const [items, setItems] = useState(() => getExtraExperiences());
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const onStorage = () => setItems(mergeDbAndLocal(getExtraExperiences()));
    window.addEventListener("storage", onStorage);

    if (!usingDb) {
      setHasFetched(true);
      return () => window.removeEventListener("storage", onStorage);
    }
    getExperiences()
      .then((data) => {
        if (data && data.length > 0) {
          const local = getExtraExperiences();
          setItems(local.length > 0 ? mergeDbAndLocal(local, data) : data);
        }
        setHasFetched(true);
      })
      .catch(() => setHasFetched(true));
    return () => window.removeEventListener("storage", onStorage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasServerData = hasFetched && items.length > 0;
  return { items, usingDb, hasServerData };
}

export function useProjectsContent() {
  const usingDb = isSupabaseConfigured();
  const [items, setItems] = useState(() => getExtraProjects());
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const onStorage = () => setItems(mergeDbAndLocal(getExtraProjects()));
    window.addEventListener("storage", onStorage);

    if (!usingDb) {
      setHasFetched(true);
      return () => window.removeEventListener("storage", onStorage);
    }
    getProjects()
      .then((data) => {
        if (data && data.length > 0) {
          const local = getExtraProjects();
          setItems(local.length > 0 ? mergeDbAndLocal(local, data) : data);
        }
        setHasFetched(true);
      })
      .catch(() => setHasFetched(true));
    return () => window.removeEventListener("storage", onStorage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasServerData = hasFetched && items.length > 0;
  return { items, usingDb, hasServerData };
}

export function usePhotosContent() {
  const usingDb = isSupabaseConfigured();
  const [items, setItems] = useState(() => getExtraPhotos());
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const onStorage = () => setItems(getExtraPhotos());
    window.addEventListener("storage", onStorage);

    if (!usingDb) {
      setHasFetched(true);
      return () => window.removeEventListener("storage", onStorage);
    }
    getPhotos()
      .then((data) => {
        if (data && data.length > 0) {
          const local = getExtraPhotos();
          setItems(local.length > 0 ? mergeDbAndLocal(local, data) : data);
        }
        setHasFetched(true);
      })
      .catch(() => setHasFetched(true));
    return () => window.removeEventListener("storage", onStorage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasServerData = hasFetched && items.length > 0;
  return { items, usingDb, hasServerData };
}
