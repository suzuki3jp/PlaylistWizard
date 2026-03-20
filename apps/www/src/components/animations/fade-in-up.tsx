"use client";
import { motion } from "framer-motion";

import type { AnimationProps } from ".";

export function FadeInUpAnimation({
  children,
  className,
  delay,
}: AnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}
