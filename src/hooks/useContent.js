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

export function useExtraExperiences() {
  const [items, setItems] = useState(getExtraExperiences);

  useEffect(() => {
    getExperiences().then(setItems).catch(() => {});
  }, []);

  return items;
}

export function useExtraProjects() {
  const [items, setItems] = useState(getExtraProjects);

  useEffect(() => {
    getProjects().then(setItems).catch(() => {});
  }, []);

  return items;
}

export function useExtraPhotos() {
  const [items, setItems] = useState(getExtraPhotos);

  useEffect(() => {
    getPhotos().then(setItems).catch(() => {});
  }, []);

  return items;
}
