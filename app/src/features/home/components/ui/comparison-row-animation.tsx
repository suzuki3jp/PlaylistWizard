"use client";
import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";

import { useScroll } from "@/lib/hooks/use-scroll";

export function ComparisonRowAnimation({
  index,
  className,
  children,
}: { index: number; className?: string } & PropsWithChildren) {
  const { ref, inView } = useScroll();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
