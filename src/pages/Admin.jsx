import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import AnimatedBackground from "../components/AnimatedBackground";
import {
  getExtraExperiences, saveExtraExperiences,
  getExtraProjects, saveExtraProjects,
  getExtraPhotos, saveExtraPhotos,
} from "../data/dynamicContent";
import {
  getExperiences, getProjects, getPhotos, getMessages,
  addExperience as apiAddExperience, deleteExperience as apiDeleteExperience,
  addProject as apiAddProject, deleteProject as apiDeleteProject,
  addPhoto as apiAddPhoto, deletePhoto as apiDeletePhoto,
  deleteMessage as apiDeleteMessage, setMessages as apiSetMessages,
  setExperiences as apiSetExperiences, setProjects as apiSetProjects, setPhotos as apiSetPhotos,
  verifyAdminPassword,
} from "../api";

const CONTACT_STORAGE_KEY = "contact_submissions_v1";

function PasswordGate({ onUnlock }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await verifyAdminPassword(pw);
    if (ok) {
      sessionStorage.setItem("pw_admin", "1");
      sessionStorage.setItem("pw_admin_password", pw);
      onUnlock();
    } else {
      setError(true);
      setPw("");
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-xs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-semibold text-text-primary mb-6 text-center">
          Admin Access
        </h1>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          autoFocus
          className={`w-full px-4 py-3 bg-glass-surface backdrop-blur-md border rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none transition-colors ${
            error ? "border-red-500 animate-shake" : "border-border focus:border-accent"
          }`}
        />
        <button
          type="submit"
          className="mt-3 w-full px-4 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          Enter
        </button>
        {error && (
          <p className="mt-2 text-red-400 text-xs text-center">Wrong password</p>
        )}
      </motion.form>
    </div>
  );
}

function AdminPanel() {
  const [tab, setTab] = useState("experience");
  const [experiences, setExperiences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [apiAvailable, setApiAvailable] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [ex, pr, ph, ms] = await Promise.all([
          getExperiences(),
          getProjects(),
          getPhotos(),
          getMessages().catch(() => []),
        ]);
        if (mounted) {
          setExperiences(ex);
          setProjects(pr);
          setPhotos(ph);
          setMessages(ms);
          setApiAvailable(true);
        }
      } catch {
        if (mounted) {
          setExperiences(getExtraExperiences());
          setProjects(getExtraProjects());
          setPhotos(getExtraPhotos());
          setMessages(JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY) || "[]"));
          setApiAvailable(false);
        }
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Experience form
  const [expForm, setExpForm] = useState({ title: "", company: "", period: "", description: "" });
  // Project form
  const [projForm, setProjForm] = useState({ title: "", description: "", tags: "", github: "", live: "" });
  // Photo form
  const [photoForm, setPhotoForm] = useState({ url: "", alt: "" });
  const [isDragOver, setIsDragOver] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const addExperience = async (e) => {
    e.preventDefault();
    const newItem = { ...expForm, id: Date.now() };
    if (apiAvailable) {
      try {
        const saved = await apiAddExperience(newItem);
        setExperiences((prev) => [...prev, saved]);
        setExpForm({ title: "", company: "", period: "", description: "" });
        return;
      } catch {
        // fallback to localStorage
      }
    }
    const updated = [...experiences, newItem];
    setExperiences(updated);
    saveExtraExperiences(updated);
    setExpForm({ title: "", company: "", period: "", description: "" });
  };

  const removeExperience = async (id) => {
    if (apiAvailable) {
      try {
        await apiDeleteExperience(id);
        setExperiences((prev) => prev.filter((x) => x.id !== id));
        return;
      } catch {
        // fallback to localStorage
      }
    }
    const updated = experiences.filter((x) => x.id !== id);
    setExperiences(updated);
    saveExtraExperiences(updated);
  };

  const addProject = async (e) => {
    e.preventDefault();
    const item = {
      ...projForm,
      tags: projForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      id: Date.now(),
    };
    if (apiAvailable) {
      try {
        const saved = await apiAddProject(item);
        setProjects((prev) => [...prev, saved]);
        setProjForm({ title: "", description: "", tags: "", github: "", live: "" });
        return;
      } catch {
        // fallback
      }
    }
    const updated = [...projects, item];
    setProjects(updated);
    saveExtraProjects(updated);
    setProjForm({ title: "", description: "", tags: "", github: "", live: "" });
  };

  const removeProject = async (id) => {
    if (apiAvailable) {
      try {
        await apiDeleteProject(id);
        setProjects((prev) => prev.filter((x) => x.id !== id));
        return;
      } catch {
        // fallback
      }
    }
    const updated = projects.filter((x) => x.id !== id);
    setProjects(updated);
    saveExtraProjects(updated);
  };

  const addPhoto = async (e) => {
    e.preventDefault();
    if (!photoForm.url.trim()) {
      setPhotoError("Please upload an image or provide an image URL.");
      return;
    }
    const newItem = { ...photoForm, id: Date.now() };
    if (apiAvailable) {
      try {
        const saved = await apiAddPhoto(newItem);
        setPhotos((prev) => [...prev, saved]);
        setPhotoForm({ url: "", alt: "" });
        setPhotoError("");
        return;
      } catch {
        // fallback
      }
    }
    const updated = [...photos, newItem];
    setPhotos(updated);
    saveExtraPhotos(updated);
    setPhotoForm({ url: "", alt: "" });
    setPhotoError("");
  };

  const removePhoto = async (id) => {
    if (apiAvailable) {
      try {
        await apiDeletePhoto(id);
        setPhotos((prev) => prev.filter((x) => x.id !== id));
        return;
      } catch {
        // fallback
      }
    }
    const updated = photos.filter((x) => x.id !== id);
    setPhotos(updated);
    saveExtraPhotos(updated);
  };

  const handlePhotoFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Only image files are supported.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoForm((prev) => ({
        ...prev,
        url: String(reader.result || ""),
        alt: prev.alt || file.name.replace(/\.[^.]+$/, ""),
      }));
      setPhotoError("");
    };
    reader.onerror = () => {
      setPhotoError("Failed to read this file. Try another image.");
    };
    reader.readAsDataURL(file);
  };

  const removeMessage = async (id) => {
    if (apiAvailable) {
      try {
        await apiDeleteMessage(id);
        setMessages((prev) => prev.filter((x) => x.id !== id));
        return;
      } catch {
        // fallback
      }
    }
    const updated = messages.filter((x) => x.id !== id);
    setMessages(updated);
    localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(updated));
  };

  const tabs = [
    { key: "experience", label: "Experience" },
    { key: "projects", label: "Projects" },
    { key: "photos", label: "Photos" },
    { key: "messages", label: "Messages" },
  ];

  const inputClass =
    "w-full px-3 py-2 bg-glass-surface backdrop-blur-md border border-border rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent transition-colors";

  return (
    <div className="min-h-screen">
      <nav className="px-6 py-4 border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-lg font-semibold text-text-primary">Admin Panel</span>
          <a href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            View Site
          </a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-glass-surface backdrop-blur-md border border-border rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t.key
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Experience Tab */}
        {tab === "experience" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <form onSubmit={addExperience} className="space-y-3 mb-8">
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} placeholder="Job title" required value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} />
                <input className={inputClass} placeholder="Company" required value={expForm.company} onChange={(e) => setExpForm({ ...expForm, company: e.target.value })} />
              </div>
              <input className={inputClass} placeholder="Period (e.g. 2023 - Present)" required value={expForm.period} onChange={(e) => setExpForm({ ...expForm, period: e.target.value })} />
              <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Description" required value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} />
              <button type="submit" className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors">
                Add Experience
              </button>
            </form>
            <div className="mb-8">
              <p className="text-xs uppercase tracking-wide text-text-muted mb-2">Live Preview</p>
              <div className="bg-glass-surface backdrop-blur-md border border-border rounded-lg p-4">
                <p className="text-text-primary font-medium text-sm">
                  {expForm.title || "Job title"}
                </p>
                <p className="text-accent text-xs">
                  {(expForm.company || "Company") + " · " + (expForm.period || "Period")}
                </p>
                <p className="text-text-secondary text-xs mt-1 line-clamp-2">
                  {expForm.description || "Description preview..."}
                </p>
              </div>
            </div>
            {experiences.length > 0 && (
              <button
                onClick={async () => {
                  if (apiAvailable) {
                    try {
                      await apiSetExperiences([]);
                      setExperiences([]);
                      return;
                    } catch {}
                  }
                  setExperiences([]);
                  saveExtraExperiences([]);
                }}
                className="mb-4 px-3 py-1.5 text-xs border border-border rounded-lg text-text-muted hover:text-red-400 hover:border-red-400/50 transition-colors"
              >
                Clear All Experiences
              </button>
            )}

            {experiences.length === 0 && (
              <p className="text-text-muted text-sm text-center py-8">No extra experiences added yet.</p>
            )}
            <div className="space-y-3">
              {experiences.map((exp) => (
                <div key={exp.id} className="bg-glass-surface backdrop-blur-md border border-border rounded-lg p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-text-primary font-medium text-sm">{exp.title}</p>
                    <p className="text-accent text-xs">{exp.company} &middot; {exp.period}</p>
                    <p className="text-text-secondary text-xs mt-1 line-clamp-2">{exp.description}</p>
                  </div>
                  <button
                    onClick={() => removeExperience(exp.id)}
                    className="shrink-0 mt-1 text-xs border border-border rounded-md px-2 py-1 text-text-muted hover:text-red-400 hover:border-red-400/50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Projects Tab */}
        {tab === "projects" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <form onSubmit={addProject} className="space-y-3 mb-8">
              <input className={inputClass} placeholder="Project title" required value={projForm.title} onChange={(e) => setProjForm({ ...projForm, title: e.target.value })} />
              <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Description" required value={projForm.description} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} />
              <input className={inputClass} placeholder="Tags (comma separated, e.g. React, Node.js)" value={projForm.tags} onChange={(e) => setProjForm({ ...projForm, tags: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} placeholder="GitHub URL (optional)" value={projForm.github} onChange={(e) => setProjForm({ ...projForm, github: e.target.value })} />
                <input className={inputClass} placeholder="Live URL (optional)" value={projForm.live} onChange={(e) => setProjForm({ ...projForm, live: e.target.value })} />
              </div>
              <button type="submit" className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors">
                Add Project
              </button>
            </form>
            <div className="mb-8">
              <p className="text-xs uppercase tracking-wide text-text-muted mb-2">Live Preview</p>
              <div className="bg-glass-surface backdrop-blur-md border border-border rounded-lg p-4">
                <p className="text-text-primary font-medium text-sm">
                  {projForm.title || "Project title"}
                </p>
                <p className="text-text-secondary text-xs mt-1 line-clamp-2">
                  {projForm.description || "Description preview..."}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(projForm.tags
                    ? projForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
                    : ["Tag"]).map((tag) => (
                    <span key={tag} className="text-xs text-text-muted font-mono bg-bg-secondary px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {projects.length > 0 && (
              <button
                onClick={async () => {
                  if (apiAvailable) {
                    try {
                      await apiSetProjects([]);
                      setProjects([]);
                      return;
                    } catch {}
                  }
                  setProjects([]);
                  saveExtraProjects([]);
                }}
                className="mb-4 px-3 py-1.5 text-xs border border-border rounded-lg text-text-muted hover:text-red-400 hover:border-red-400/50 transition-colors"
              >
                Clear All Projects
              </button>
            )}

            {projects.length === 0 && (
              <p className="text-text-muted text-sm text-center py-8">No extra projects added yet.</p>
            )}
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id} className="bg-glass-surface backdrop-blur-md border border-border rounded-lg p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-text-primary font-medium text-sm">{proj.title}</p>
                    <p className="text-text-secondary text-xs mt-1 line-clamp-2">{proj.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {proj.tags?.map((tag) => (
                        <span key={tag} className="text-xs text-text-muted font-mono bg-bg-secondary px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => removeProject(proj.id)}
                    className="shrink-0 mt-1 text-xs border border-border rounded-md px-2 py-1 text-text-muted hover:text-red-400 hover:border-red-400/50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Photos Tab */}
        {tab === "photos" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <form onSubmit={addPhoto} className="space-y-3 mb-8">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  handlePhotoFile(e.dataTransfer.files?.[0]);
                }}
                className={`border border-dashed rounded-lg p-4 text-center transition-colors ${
                  isDragOver
                    ? "border-accent bg-accent/8"
                    : "border-border bg-glass-surface"
                }`}
              >
                <p className="text-sm text-text-secondary mb-2">
                  Drag and drop an image here
                </p>
                <div className="text-xs text-text-muted mb-3">or</div>
                <label className="inline-flex items-center px-3 py-1.5 rounded-md border border-border text-xs text-text-secondary hover:text-text-primary cursor-pointer transition-colors">
                  Browse Files
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoFile(e.target.files?.[0])}
                  />
                </label>
              </div>
              <input
                className={inputClass}
                placeholder="Image URL (optional if uploaded above)"
                value={photoForm.url}
                onChange={(e) => setPhotoForm({ ...photoForm, url: e.target.value })}
              />
              <input className={inputClass} placeholder="Alt text / caption" value={photoForm.alt} onChange={(e) => setPhotoForm({ ...photoForm, alt: e.target.value })} />
              <button type="submit" className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors">
                Add Photo
              </button>
              {photoError && <p className="text-xs text-red-400">{photoError}</p>}
            </form>
            <div className="mb-8">
              <p className="text-xs uppercase tracking-wide text-text-muted mb-2">Live Preview</p>
              <div className="relative aspect-square max-w-[220px] bg-glass-surface border border-border rounded-lg overflow-hidden">
                {photoForm.url ? (
                  <img src={photoForm.url} alt={photoForm.alt || "Preview"} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">
                    Image preview
                  </div>
                )}
              </div>
            </div>
            {photos.length > 0 && (
              <button
                onClick={async () => {
                  if (apiAvailable) {
                    try {
                      await apiSetPhotos([]);
                      setPhotos([]);
                      return;
                    } catch {}
                  }
                  setPhotos([]);
                  saveExtraPhotos([]);
                }}
                className="mb-4 px-3 py-1.5 text-xs border border-border rounded-lg text-text-muted hover:text-red-400 hover:border-red-400/50 transition-colors"
              >
                Clear All Photos
              </button>
            )}

            {photos.length === 0 && (
              <p className="text-text-muted text-sm text-center py-8">No extra photos added yet.</p>
            )}
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square bg-glass-surface border border-border rounded-lg overflow-hidden">
                  <img src={photo.url} alt={photo.alt} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 text-[11px] border border-white/40 bg-black/60 rounded-md px-2 py-1 text-white hover:border-red-300 hover:text-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages Tab */}
        {tab === "messages" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {messages.length > 0 && (
              <button
                onClick={async () => {
                  if (apiAvailable) {
                    try {
                      await apiSetMessages([]);
                      setMessages([]);
                      return;
                    } catch {}
                  }
                  setMessages([]);
                  localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify([]));
                }}
                className="mb-4 px-3 py-1.5 text-xs border border-border rounded-lg text-text-muted hover:text-red-400 hover:border-red-400/50 transition-colors"
              >
                Clear All Messages
              </button>
            )}
            {messages.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">No contact messages yet.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-glass-surface backdrop-blur-md border border-border rounded-lg p-4 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="text-text-primary font-medium text-sm">
                        {msg.name} <span className="text-text-muted font-normal">({msg.email})</span>
                      </p>
                      <p className="text-text-secondary text-xs mt-1 whitespace-pre-wrap">
                        {msg.message}
                      </p>
                      <p className="text-text-muted text-[11px] mt-2">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => removeMessage(msg.id)}
                      className="text-text-muted hover:text-red-400 transition-colors shrink-0 mt-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("pw_admin") === "1");

  return (
    <>
      <AnimatedBackground />
      {authed ? <AdminPanel /> : <PasswordGate onUnlock={() => setAuthed(true)} />}
    </>
  );
}
