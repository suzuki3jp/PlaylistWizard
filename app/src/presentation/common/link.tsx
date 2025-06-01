import { cn } from "@/presentation/common/cn";
import NextLink, { type LinkProps as NextLinkProps } from "next/link";

export interface LinkProps extends NextLinkProps {
  openInNewTab?: boolean;
  underline?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * A wrapper around the Next.js Link component.
 */
export function Link({
  openInNewTab,
  className,
  children,
  underline,
  ...props
}: LinkProps) {
  return (
    <NextLink
      {...props}
      target={openInNewTab ? "_blank" : undefined}
      className={underline ? cn(className, "underline") : className}
    >
      {children}
    </NextLink>
  );
}
