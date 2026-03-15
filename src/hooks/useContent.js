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

export function useExperiencesContent() {
  const usingDb = isSupabaseConfigured();
  const [items, setItems] = useState(() => (usingDb ? [] : getExtraExperiences()));
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!usingDb) {
      // No backend — localStorage is the source of truth; listen for changes
      const onStorage = () => setItems(getExtraExperiences());
      window.addEventListener("storage", onStorage);
      setHasFetched(true);
      return () => window.removeEventListener("storage", onStorage);
    }
    getExperiences()
      .then((data) => {
        setItems(data);
        setHasFetched(true);
      })
      .catch(() => setHasFetched(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasServerData = hasFetched && items.length > 0;
  return { items, usingDb, hasServerData };
}

export function useProjectsContent() {
  const usingDb = isSupabaseConfigured();
  const [items, setItems] = useState(() => (usingDb ? [] : getExtraProjects()));
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!usingDb) {
      const onStorage = () => setItems(getExtraProjects());
      window.addEventListener("storage", onStorage);
      setHasFetched(true);
      return () => window.removeEventListener("storage", onStorage);
    }
    getProjects()
      .then((data) => {
        setItems(data);
        setHasFetched(true);
      })
      .catch(() => setHasFetched(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasServerData = hasFetched && items.length > 0;
  return { items, usingDb, hasServerData };
}

export function usePhotosContent() {
  const usingDb = isSupabaseConfigured();
  const [items, setItems] = useState(() => (usingDb ? [] : getExtraPhotos()));
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!usingDb) {
      const onStorage = () => setItems(getExtraPhotos());
      window.addEventListener("storage", onStorage);
      setHasFetched(true);
      return () => window.removeEventListener("storage", onStorage);
    }
    getPhotos()
      .then((data) => {
        setItems(data);
        setHasFetched(true);
      })
      .catch(() => setHasFetched(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasServerData = hasFetched && items.length > 0;
  return { items, usingDb, hasServerData };
}
