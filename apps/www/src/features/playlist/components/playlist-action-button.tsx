import { Button, type ButtonProps, cn } from "@playlistwizard/ui";
import type { PropsWithChildren } from "react";

type PlaylistActionButtonProps = PropsWithChildren<ButtonProps>;

export function PlaylistActionButton({
  children,
  className,
  ...buttonProps
}: PlaylistActionButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "border border-gray-700 bg-background text-white shadow-xs hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700",
        className,
      )}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}
