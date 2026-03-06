const STORAGE_KEYS = {
  experiences: "pw_experiences",
  projects: "pw_projects",
  photos: "pw_photos",
};

export function getExtraExperiences() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.experiences) || "[]");
  } catch {
    return [];
  }
}

export function saveExtraExperiences(items) {
  localStorage.setItem(STORAGE_KEYS.experiences, JSON.stringify(items));
}

export function getExtraProjects() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.projects) || "[]");
  } catch {
    return [];
  }
}

export function saveExtraProjects(items) {
  localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(items));
}

export function getExtraPhotos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.photos) || "[]");
  } catch {
    return [];
  }
}

export function saveExtraPhotos(items) {
  localStorage.setItem(STORAGE_KEYS.photos, JSON.stringify(items));
}
