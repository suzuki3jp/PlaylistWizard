"use client";
import type React from "react";

import { useScroll } from "../hooks/useScroll";
import { cn } from "../lib/cn";

interface FadeInProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

/**
 * FadeIn component that fades in its children when they come into view.
 * @param {React.ReactNode} children - The content to be displayed.
 * @param {number} delay - Delay before the fade-in effect starts (in seconds).
 * @param {string} direction - The direction from which the element should fade in.
 * @param {string} className - Additional class names for styling.
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  ...props
}: FadeInProps) {
  const { ref, isInView } = useScroll<HTMLDivElement>();

  const getTransformValue = () => {
    switch (direction) {
      case "up":
        return "translateY(30px)";
      case "down":
        return "translateY(-30px)";
      case "left":
        return "translateX(30px)";
      case "right":
        return "translateX(-30px)";
      default:
        return "none";
    }
  };

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "none" : getTransformValue(),
        transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
        transitionDelay: `${delay}s`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * FadeInItem component that is child of FadeIn component.
 * @param {React.ReactNode} children - The content to be displayed.
 * @param {number} delay - Delay before the fade-in effect starts (in seconds).
 * @param {string} direction - The direction from which the element should fade in.
 * @param {string} className - Additional class names for styling.
 */
export function FadeInItem({
  children,
  className,
  delay = 0,
  direction = "up",
  ...props
}: FadeInProps) {
  return (
    <FadeIn
      className={className}
      delay={delay}
      direction={direction}
      {...props}
    >
      {children}
    </FadeIn>
  );
}
