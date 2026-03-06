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
    getExperiences()
      .then((data) => {
        setItems(data);
        setHasFetched(true);
      })
      .catch(() => setHasFetched(true));
  }, []);

  const hasServerData = hasFetched && items.length > 0;
  return { items, usingDb, hasServerData };
}

export function useProjectsContent() {
  const usingDb = isSupabaseConfigured();
  const [items, setItems] = useState(() => (usingDb ? [] : getExtraProjects()));
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    getProjects()
      .then((data) => {
        setItems(data);
        setHasFetched(true);
      })
      .catch(() => setHasFetched(true));
  }, []);

  const hasServerData = hasFetched && items.length > 0;
  return { items, usingDb, hasServerData };
}

export function usePhotosContent() {
  const usingDb = isSupabaseConfigured();
  const [items, setItems] = useState(() => (usingDb ? [] : getExtraPhotos()));

  useEffect(() => {
    getPhotos().then(setItems).catch(() => {});
  }, []);

  return { items, usingDb };
}
