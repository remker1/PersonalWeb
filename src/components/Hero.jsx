import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Apple-like scroll linkage: gentle lift + scale + fade
  const p = useSpring(scrollYProgress, { stiffness: 180, damping: 30, mass: 0.6 });
  const contentY = useTransform(p, [0, 1], [0, -90]);
  const contentScale = useTransform(p, [0, 1], [1, 0.92]);
  const contentOpacity = useTransform(p, [0, 0.85, 1], [1, 0.55, 0.25]);
  const glowOpacity = useTransform(p, [0, 0.6, 1], [0.9, 0.45, 0]);
  const glowScale = useTransform(p, [0, 1], [1, 1.08]);
  const glowBlur = useTransform(p, [0, 1], ["blur(0px)", "blur(10px)"]);

  return (
    <section ref={sectionRef} className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        className="relative max-w-3xl text-center"
        style={{ y: contentY, scale: contentScale, opacity: contentOpacity }}
      >
        {/* Subtle “product glow” behind the headline */}
        <motion.div
          aria-hidden="true"
          className="absolute left-1/2 top-12 -translate-x-1/2 w-[min(760px,92vw)] h-[380px] rounded-full pointer-events-none"
          style={{
            opacity: glowOpacity,
            scale: glowScale,
            filter: glowBlur,
            background:
              "radial-gradient(closest-side, rgba(154, 196, 168, 0.28) 0%, rgba(154, 196, 168, 0.10) 35%, rgba(154, 196, 168, 0) 70%)",
          }}
        />

        <motion.p
          className="text-accent text-sm font-medium tracking-wide uppercase mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {t.hero.greeting}
        </motion.p>
        <motion.h1
          className="text-5xl md:text-7xl font-bold text-text-primary mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {t.hero.name}
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl text-text-secondary mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {t.hero.title}
        </motion.p>
        <motion.p
          className="text-text-muted max-w-xl mx-auto mb-12 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {t.hero.description}
        </motion.p>
        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
        >
          <a
            href="#projects"
            className="px-6 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t.hero.viewWork}
          </a>
          <a
            href="#contact"
            className="px-6 py-3 border border-border hover:border-text-muted text-text-secondary hover:text-text-primary text-sm font-medium rounded-lg transition-colors"
          >
            {t.hero.getInTouch}
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
