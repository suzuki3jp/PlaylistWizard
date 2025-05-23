import type React from "react";

import { cn } from "@/lib/utils";

type TextProps = Readonly<React.PropsWithChildren<{ className?: string }>>;

/**
 * The text component.
 * It is composed of <p> tag.
 * The class name is set to text-muted-foreground.
 * @param param0
 */
export const Text: React.FC<TextProps> = ({ children, className }) => {
  return <p className={cn("text-muted-foreground", className)}>{children}</p>;
};
