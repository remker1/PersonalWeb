import { useState } from "react";
import { useDocTitle, useT } from "./testersUtils";

const EMPTY_FORM = { name: "", email: "", message: "", website: "" };

export default function DeveloperContact() {
  const t = useT();
  useDocTitle(t("contactDeveloper"));
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("idle");

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus("sending");
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "testers.remker1.dev" }),
      });
      if (!response.ok) throw new Error("Message request failed");
      setForm(EMPTY_FORM);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center">
        <div className="text-5xl" aria-hidden>✉️</div>
        <h1 className="mt-4 text-3xl font-bold">{t("contactDeveloper")}</h1>
        <p className="mt-3 text-text-secondary">{t("ctIntro")}</p>
      </div>

      {status === "sent" ? (
        <div className="mt-8 rounded-2xl border border-green-500/40 bg-green-500/10 p-8 text-center">
          <div className="text-4xl" aria-hidden>✓</div>
          <h2 className="mt-3 text-xl font-semibold">{t("ctSentTitle")}</h2>
          <p className="mt-2 text-sm text-text-secondary">{t("ctSentDesc")}</p>
          <button onClick={() => setStatus("idle")} className="mt-5 text-sm font-medium text-accent hover:text-accent-hover">
            {t("ctSendAnother")}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-bg-card p-6 sm:p-8 space-y-5">
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-text-secondary mb-1.5">{t("ctName")}</label>
            <input id="contact-name" required maxLength={120} value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder={t("ctNamePlaceholder")} className="w-full rounded-xl border border-border bg-bg-primary px-4 py-3 text-sm focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-text-secondary mb-1.5">{t("ctEmail")}</label>
            <input id="contact-email" type="email" required maxLength={254} value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder={t("ctEmailPlaceholder")} className="w-full rounded-xl border border-border bg-bg-primary px-4 py-3 text-sm focus:outline-none focus:border-accent" />
          </div>
          <div className="hidden" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input id="contact-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => updateField("website", event.target.value)} />
          </div>
          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium text-text-secondary mb-1.5">{t("ctMessage")}</label>
            <textarea id="contact-message" required maxLength={4000} rows={6} value={form.message} onChange={(event) => updateField("message", event.target.value)} placeholder={t("ctMessagePlaceholder")} className="w-full resize-none rounded-xl border border-border bg-bg-primary px-4 py-3 text-sm focus:outline-none focus:border-accent" />
          </div>
          {status === "error" && <p className="text-sm text-red-500">{t("ctError")}</p>}
          <button type="submit" disabled={status === "sending"} className="w-full rounded-xl bg-accent px-5 py-3 font-semibold text-bg-primary hover:bg-accent-hover disabled:opacity-50 transition-colors">
            {status === "sending" ? t("ctSending") : t("ctSend")}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-xs text-text-muted">🔒 {t("ctPrivacy")}</p>
    </div>
  );
}
