import { useState } from "react";
import AnimatedBackground from "../components/AnimatedBackground";

const STORAGE_KEY = "contact_submissions_v1";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState("");

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();

    const entry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    };

    try {
      const previous = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const next = [entry, ...previous];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStatus("Message sent. Thank you!");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("Could not save your message. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <AnimatedBackground />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16l-4-4m0 0l4-4m-4 4h18"
            />
          </svg>
          Back Home
        </a>

        <h1 className="text-4xl font-bold text-text-primary mb-2">Contact Me</h1>
        <p className="text-text-secondary mb-10">
          Leave your name, email, and message. Your submission will be recorded.
        </p>

        <form
          onSubmit={onSubmit}
          className="bg-glass-surface backdrop-blur-md border border-border rounded-xl p-6 space-y-5"
        >
          <div>
            <label htmlFor="name" className="block text-sm text-text-secondary mb-2">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={onChange}
              className="w-full px-4 py-3 rounded-lg border border-border bg-bg-card/70 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-text-secondary mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={onChange}
              className="w-full px-4 py-3 rounded-lg border border-border bg-bg-card/70 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm text-text-secondary mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={6}
              value={form.message}
              onChange={onChange}
              className="w-full px-4 py-3 rounded-lg border border-border bg-bg-card/70 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="Your message..."
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            Send Message
          </button>

          {status && <p className="text-sm text-text-secondary">{status}</p>}
        </form>
      </div>
    </div>
  );
}
