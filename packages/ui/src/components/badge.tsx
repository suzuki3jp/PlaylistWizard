import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "../lib/cn";

const badgeVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 inline-flex w-fit shrink-0 items-center justify-center overflow-hidden border font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground [a&]:hover:bg-primary/90 gap-1 rounded-md border-transparent px-2 py-0.5 text-xs [&>svg]:size-3",
        marketing:
          "gap-2 rounded-full border-gray-700 bg-gray-800 px-4 py-2 text-sm text-pink-300 [&>svg]:size-4",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 gap-1 rounded-md border-transparent px-2 py-0.5 text-xs [&>svg]:size-3",
        destructive:
          "bg-destructive focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90 gap-1 rounded-md border-transparent px-2 py-0.5 text-xs text-white [&>svg]:size-3",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground gap-1 rounded-md px-2 py-0.5 text-xs [&>svg]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
