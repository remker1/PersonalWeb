import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { marked } from "marked";
import AnimatedBackground from "../components/AnimatedBackground";
import Navbar from "../components/Navbar";
import { getPost } from "../api";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Configure marked for safe rendering
marked.setOptions({ breaks: true, gfm: true });

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPost(slug)
      .then(setPost)
      .catch(() => navigate("/404", { replace: true }))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  return (
    <>
      <AnimatedBackground />
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-10 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to blog
          </Link>

          {loading && (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-border rounded w-32" />
              <div className="h-10 bg-border rounded w-3/4" />
              <div className="h-4 bg-border rounded w-full" />
              <div className="h-4 bg-border rounded w-5/6" />
            </div>
          )}

          {!loading && post && (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Header */}
              <header className="mb-10">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <time className="text-xs text-text-muted">
                    {formatDate(post.created_at)}
                  </time>
                  {post.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-text-muted font-mono bg-bg-secondary px-1.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3 leading-tight">
                  {post.title}
                </h1>
                {post.excerpt && (
                  <p className="text-text-secondary text-lg leading-relaxed">
                    {post.excerpt}
                  </p>
                )}
              </header>

              <div className="w-full h-px bg-border mb-10" />

              {/* Markdown content */}
              <div
                className="prose-remker"
                dangerouslySetInnerHTML={{ __html: marked.parse(post.content || "") }}
              />
            </motion.article>
          )}
        </div>
      </main>
    </>
  );
}
