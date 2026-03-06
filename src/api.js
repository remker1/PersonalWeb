/**
 * API client: Supabase for reads + contact form when configured;
 * Vercel serverless /api/admin for all admin actions (and getMessages).
 * Falls back to fetch to Express backend when Supabase is not configured.
 */

import { supabase, isSupabaseConfigured } from "./lib/supabase";

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

// ——— Public reads: Supabase (if configured) or Express fallback ———

export async function getExperiences() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r) => ({ ...r, id: Number(r.id) }));
    } catch {
      return [];
    }
  }
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
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("projects").select("*").order("id", { ascending: true });
      if (error) throw error;
      return (data || []).map((r) => ({ ...r, id: Number(r.id), tags: r.tags || [] }));
    } catch {
      return [];
    }
  }
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
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("photos").select("*").order("id", { ascending: true });
      if (error) throw error;
      return (data || []).map((r) => ({ ...r, id: Number(r.id), url: r.url, alt: r.alt || "" }));
    } catch {
      return [];
    }
  }
  try {
    const res = await fetch(`${API_BASE}/api/photos`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

// ——— Contact form: Supabase insert (if configured) or Express fallback ———

export async function submitMessage(entry) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("messages").insert({
      name: entry.name,
      email: entry.email,
      message: entry.message,
    });
    if (error) throw new Error(error.message);
    return {};
  }
  const res = await fetch(`${API_BASE}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ——— Admin: single serverless endpoint (Vercel /api/admin or Express fallback) ———

async function callAdminWithPassword(password, action, payload = {}) {
  const res = await fetch(`${API_BASE}/api/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, action, payload }),
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return;
  return res.json();
}

async function callAdmin(action, payload = {}) {
  return callAdminWithPassword(getAdminPassword(), action, payload);
}

export async function verifyAdminPassword(password) {
  // Preferred: serverless admin endpoint (Vercel) with ping.
  try {
    await callAdminWithPassword(password, "ping");
    return true;
  } catch (err) {
    // If serverless isn't available, try the Express backend auth path.
    // A correct password will allow GET /api/messages (admin-only) to return 200.
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
  if (isSupabaseConfigured()) {
    try {
      const data = await callAdmin("getMessages");
      return data?.items ?? [];
    } catch {
      return [];
    }
  }
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
  if (isSupabaseConfigured()) {
    const data = await callAdmin("addExperience", item);
    return data;
  }
  const res = await fetch(`${API_BASE}/api/experiences`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteExperience(id) {
  if (isSupabaseConfigured()) {
    await callAdmin("deleteExperience", { id });
    return;
  }
  const res = await fetch(`${API_BASE}/api/experiences/${id}`, { method: "DELETE", headers: getAuthHeader() });
  if (!res.ok) throw new Error(await res.text());
}

export async function setExperiences(items) {
  if (isSupabaseConfigured()) {
    await callAdmin("setExperiences", { items });
    return { items };
  }
  const res = await fetch(`${API_BASE}/api/experiences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addProject(item) {
  if (isSupabaseConfigured()) {
    const data = await callAdmin("addProject", item);
    return data;
  }
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteProject(id) {
  if (isSupabaseConfigured()) {
    await callAdmin("deleteProject", { id });
    return;
  }
  const res = await fetch(`${API_BASE}/api/projects/${id}`, { method: "DELETE", headers: getAuthHeader() });
  if (!res.ok) throw new Error(await res.text());
}

export async function setProjects(items) {
  if (isSupabaseConfigured()) {
    await callAdmin("setProjects", { items });
    return { items };
  }
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addPhoto(item) {
  if (isSupabaseConfigured()) {
    const data = await callAdmin("addPhoto", item);
    return data;
  }
  const res = await fetch(`${API_BASE}/api/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deletePhoto(id) {
  if (isSupabaseConfigured()) {
    await callAdmin("deletePhoto", { id });
    return;
  }
  const res = await fetch(`${API_BASE}/api/photos/${id}`, { method: "DELETE", headers: getAuthHeader() });
  if (!res.ok) throw new Error(await res.text());
}

export async function setPhotos(items) {
  if (isSupabaseConfigured()) {
    await callAdmin("setPhotos", { items });
    return { items };
  }
  const res = await fetch(`${API_BASE}/api/photos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteMessage(id) {
  if (isSupabaseConfigured()) {
    await callAdmin("deleteMessage", { id });
    return;
  }
  const res = await fetch(`${API_BASE}/api/messages/${id}`, { method: "DELETE", headers: getAuthHeader() });
  if (!res.ok) throw new Error(await res.text());
}

export async function setMessages(items) {
  if (isSupabaseConfigured()) {
    await callAdmin("setMessages", { items });
    return { items };
  }
  const res = await fetch(`${API_BASE}/api/messages`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
