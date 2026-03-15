import { motion } from "motion/react";

const variants = {
  "fade-up": {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-down": {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-left": {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0 },
  },
  "fade-right": {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0 },
  },
  "scale-up": {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1 },
  },
  "blur-in": {
    hidden: { opacity: 0, filter: "blur(10px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

/**
 * ScrollReveal - wraps children in scroll-triggered animation.
 *
 * @param {"fade-up"|"fade-down"|"fade-left"|"fade-right"|"scale-up"|"blur-in"} variant
 * @param {number} delay - additional delay in seconds
 * @param {number} duration - animation duration
 * @param {boolean} stagger - if true, staggers direct children (wrap each child in ScrollReveal.Item)
 * @param {string} className
 */
export default function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 0.6,
  stagger = false,
  className = "",
  as = "div",
}) {
  const Component = motion[as] || motion.div;

  if (stagger) {
    return (
      <Component
        className={className}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {children}
      </Component>
    );
  }

  return (
    <Component
      className={className}
      variants={variants[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </Component>
  );
}

ScrollReveal.Item = function ScrollRevealItem({
  children,
  variant = "fade-up",
  duration = 0.5,
  className = "",
}) {
  return (
    <motion.div
      className={className}
      variants={variants[variant]}
      transition={{
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
};
