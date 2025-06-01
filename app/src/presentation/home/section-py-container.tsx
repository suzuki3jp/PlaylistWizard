import type { HTMLAttributes } from "react";

import { cn } from "@/presentation/common/cn";

interface SectionPyContainerProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * A container component that applies padding-y to its children.
 * Used in the home page and other pages for layout consistency.
 * @param param0
 * @returns
 */
export function SectionPyContainer({
  children,
  className,
  ...props
}: SectionPyContainerProps) {
  return (
    <div
      className={cn("py-12 md:py-24 lg:py-32 xl:py-48", className)}
      {...props}
    >
      {children}
    </div>
  );
}
