import { Link } from "react-router-dom";
import { motion } from "motion/react";
import AnimatedBackground from "../components/AnimatedBackground";

export default function NotFound() {
  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-accent text-sm font-medium uppercase tracking-widest mb-4">
            Page not found
          </p>
          <h1 className="text-8xl font-bold text-text-primary mb-4 leading-none">
            404
          </h1>
          <p className="text-text-secondary text-lg mb-8 max-w-sm">
            Looks like this page wandered off. Let's get you back on track.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/"
              className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
            >
              Go home
            </Link>
            <Link
              to="/blog"
              className="px-5 py-2.5 border border-border text-text-secondary hover:text-text-primary text-sm font-medium rounded-lg transition-colors"
            >
              Read blog
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
