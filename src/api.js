/**
 * API client: all requests go to the Express backend.
 */

const API_BASE = "";

function getAdminPassword() {
  try {
    return sessionStorage.getItem("pw_admin_password") || "";
  } catch {
    return "";
  }
}

function getAuthHeader() {
  const pw = getAdminPassword();
  return pw ? { Authorization: `Bearer ${pw}` } : {};
}

// ——— Public reads ———

export async function getExperiences() {
  try {
    const res = await fetch(`${API_BASE}/api/experiences`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

export async function getProjects() {
  try {
    const res = await fetch(`${API_BASE}/api/projects`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

export async function getPhotos() {
  try {
    const res = await fetch(`${API_BASE}/api/photos`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

// ——— Contact form ———

export async function submitMessage(entry) {
  const res = await fetch(`${API_BASE}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ——— Admin ———

export async function verifyAdminPassword(password) {
  try {
    const res = await fetch(`${API_BASE}/api/admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, action: "ping" }),
    });
    return res.ok;
  } catch {
    // Fallback: try Bearer auth on messages endpoint
    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        headers: { Authorization: `Bearer ${password}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export async function getMessages() {
  try {
    const res = await fetch(`${API_BASE}/api/messages`, { headers: getAuthHeader() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

export async function addExperience(item) {
  const res = await fetch(`${API_BASE}/api/experiences`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteExperience(id) {
  const res = await fetch(`${API_BASE}/api/experiences/${id}`, { method: "DELETE", headers: getAuthHeader() });
  if (!res.ok) throw new Error(await res.text());
}

export async function setExperiences(items) {
  const res = await fetch(`${API_BASE}/api/experiences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addProject(item) {
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteProject(id) {
  const res = await fetch(`${API_BASE}/api/projects/${id}`, { method: "DELETE", headers: getAuthHeader() });
  if (!res.ok) throw new Error(await res.text());
}

export async function setProjects(items) {
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addPhoto(item) {
  const res = await fetch(`${API_BASE}/api/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deletePhoto(id) {
  const res = await fetch(`${API_BASE}/api/photos/${id}`, { method: "DELETE", headers: getAuthHeader() });
  if (!res.ok) throw new Error(await res.text());
}

export async function setPhotos(items) {
  const res = await fetch(`${API_BASE}/api/photos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteMessage(id) {
  const res = await fetch(`${API_BASE}/api/messages/${id}`, { method: "DELETE", headers: getAuthHeader() });
  if (!res.ok) throw new Error(await res.text());
}

export async function setMessages(items) {
  const res = await fetch(`${API_BASE}/api/messages`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
