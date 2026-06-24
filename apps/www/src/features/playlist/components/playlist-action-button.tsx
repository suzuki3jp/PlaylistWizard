import { Button, type ButtonProps, cn } from "@playlistwizard/ui";
import { Loader2 } from "lucide-react";
import type { PropsWithChildren } from "react";

type PlaylistActionButtonProps = PropsWithChildren<
  ButtonProps & {
    isLoading?: boolean;
  }
>;

export function PlaylistActionButton({
  children,
  className,
  disabled,
  isLoading = false,
  ...buttonProps
}: PlaylistActionButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        "bg-background relative border border-gray-700 text-white shadow-xs hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700",
        className,
      )}
      {...buttonProps}
    >
      {isLoading ? (
        <Loader2 className="absolute h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      <span
        className={cn(
          "inline-flex items-center",
          isLoading ? "opacity-0" : undefined,
        )}
      >
        {children}
      </span>
    </Button>
  );
}
