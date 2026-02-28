import { ExternalLink } from "lucide-react";
import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import { cn } from "@/lib/cn";

export interface LinkProps extends NextLinkProps {
  openInNewTab?: boolean;
  showExternalIcon?: boolean;
  underline?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * A wrapper around the Next.js Link component.
 */
export function Link({
  openInNewTab,
  showExternalIcon,
  className,
  children,
  underline,
  ...props
}: LinkProps) {
  const isMail =
    typeof props.href === "string" &&
    (props.href as string).startsWith("mailto:");
  const shouldShowIcon = showExternalIcon ?? (openInNewTab || isMail);

  return (
    <NextLink
      {...props}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      className={underline ? cn(className, "underline") : className}
    >
      {children}
      {shouldShowIcon && (
        <ExternalLink
          className="ml-0.5 inline-block h-3 w-3 shrink-0 align-middle"
          aria-hidden
        />
      )}
    </NextLink>
  );
}
