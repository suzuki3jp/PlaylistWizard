"use client";

import { useInView } from "framer-motion";
import { useRef } from "react";

export function useScroll(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: threshold });

  return {
    ref,
    inView,
  };
}
