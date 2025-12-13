import type { PropsWithChildren } from "react";
import { cn } from "@/presentation/common/cn";
import { Button, type ButtonProps } from "@/presentation/shadcn/button";

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
        "border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white",
        className,
      )}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}
