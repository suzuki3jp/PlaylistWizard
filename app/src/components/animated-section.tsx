"use client";
import type React from "react";

import { useScroll } from "@/hooks/useScroll";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
}

export function AnimatedSection({
    children,
    className,
    delay = 0,
    direction = "up",
    ...props
}: AnimatedSectionProps) {
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

export function AnimatedItem({
    children,
    className,
    delay = 0,
    direction = "up",
    ...props
}: AnimatedSectionProps) {
    return (
        <AnimatedSection
            className={className}
            delay={delay}
            direction={direction}
            {...props}
        >
            {children}
        </AnimatedSection>
    );
}
