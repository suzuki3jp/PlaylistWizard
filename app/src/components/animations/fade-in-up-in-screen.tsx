"use client";

import { motion } from "framer-motion";

import { useScroll } from "@/lib/hooks/use-scroll";
import type { AnimationProps } from ".";

export function FadeInUpInScreenAnimation({
  children,
  className = "",
  delay = 0,
}: AnimationProps) {
  const { ref, inView } = useScroll();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
