import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import AnimatedBackground from "../components/AnimatedBackground";
import Navbar from "../components/Navbar";
import { getPosts } from "../api";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPosts().then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <AnimatedBackground />
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-accent text-sm font-medium uppercase tracking-widest mb-2">
              Writing
            </p>
            <h1 className="text-4xl font-bold text-text-primary mb-3">
              Blog
            </h1>
            <p className="text-text-secondary mb-12">
              Thoughts on software, projects, and things I'm learning.
            </p>
          </motion.div>

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-glass-surface border border-border rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-border rounded w-24 mb-3" />
                  <div className="h-6 bg-border rounded w-3/4 mb-2" />
                  <div className="h-4 bg-border rounded w-full" />
                </div>
              ))}
            </div>
          )}

          {!loading && posts.length === 0 && (
            <p className="text-text-muted text-center py-16">
              No posts yet — check back soon.
            </p>
          )}

          {!loading && posts.length > 0 && (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="block bg-glass-surface backdrop-blur-md border border-border rounded-lg p-6 hover:border-accent/50 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                    <h2 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors mb-1">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-text-secondary text-sm line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <p className="text-accent text-xs font-medium mt-3 flex items-center gap-1">
                      Read more
                      <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </p>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
