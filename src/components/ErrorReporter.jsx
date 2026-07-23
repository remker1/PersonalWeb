import { Component, useEffect } from "react";

const reported = new Set();

function reportError(error, source) {
  const normalized = error instanceof Error ? error : new Error(String(error || "Unknown error"));
  const signature = `${source}:${normalized.message}:${normalized.stack || ""}`;
  if (reported.has(signature)) return;
  reported.add(signature);

  fetch("/api/messages?clientError=1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: normalized.message,
      stack: normalized.stack || "",
      source,
      page: window.location.href,
      userAgent: navigator.userAgent,
    }),
    keepalive: true,
  }).catch(() => {});
}

function GlobalErrorReporter() {
  useEffect(() => {
    const onError = (event) => reportError(event.error || event.message, "window.error");
    const onRejection = (event) => reportError(event.reason, "unhandledrejection");
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}

class WebsiteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    const stack = [error?.stack, info?.componentStack].filter(Boolean).join("\n");
    reportError(new Error(`${error?.message || "React render error"}\n${stack}`), "react.error-boundary");
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const chinese = navigator.language?.toLowerCase().startsWith("zh");
    return (
      <main className="min-h-screen bg-bg-primary text-text-primary grid place-items-center px-6">
        <div className="max-w-md text-center">
          <div className="text-5xl" aria-hidden>⚠️</div>
          <h1 className="mt-5 text-2xl font-bold">{chinese ? "页面遇到问题" : "Something went wrong"}</h1>
          <p className="mt-3 text-text-secondary">
            {chinese ? "错误信息已自动发送。请刷新页面后重试。" : "The error was reported automatically. Refresh the page to try again."}
          </p>
          <button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-accent px-5 py-2.5 font-medium text-bg-primary">
            {chinese ? "刷新页面" : "Refresh page"}
          </button>
        </div>
      </main>
    );
  }
}

export default function ErrorReporter({ children }) {
  return (
    <WebsiteErrorBoundary>
      <GlobalErrorReporter />
      {children}
    </WebsiteErrorBoundary>
  );
}
