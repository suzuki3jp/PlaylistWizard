import Link from "next/link";
import type { PropsWithChildren } from "react";

import { cn } from "@/presentation/common/cn";
import { Button, type ButtonProps } from "@/presentation/shadcn/button";

interface LinkButtonProps extends PropsWithChildren {
  href: string;
  variant?: ButtonProps["variant"];
  className?: string;
}

export function LinkButton({
  href,
  className,
  children,
  variant,
}: LinkButtonProps) {
  return (
    <Link href={href}>
      <Button
        variant={variant}
        size={"lg"}
        className={cn(
          "px-8 py-4 font-semibold text-lg transition-all duration-200",
          className,
        )}
      >
        {children}
      </Button>
    </Link>
  );
}
