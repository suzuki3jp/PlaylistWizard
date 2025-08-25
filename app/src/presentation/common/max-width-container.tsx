import type { HTMLAttributes } from "react";
import { cn } from "@/presentation/common/cn";

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
      className={cn("items-cnter flex w-full justify-center", className)}
      {...props}
    >
      <div className="container px-4 md:px-6">{children}</div>
    </div>
  );
}
