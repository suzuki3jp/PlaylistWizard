import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface MaxWidthContainerProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * A container component that centers its children and applies padding.
 * Used in the home page and other pages for layout consistency.
 * @param param0
 * @returns
 */
export function MaxWidthContainer({
  children,
  className,
  ...props
}: MaxWidthContainerProps) {
  return (
    <div
      className={cn(
        "w-full flex items-cnter justify-center py-12 md:py-24 lg:py-32 xl:py-48",
        className,
      )}
      {...props}
    >
      <div className="container px-4 md:px-6">{children}</div>
    </div>
  );
}
