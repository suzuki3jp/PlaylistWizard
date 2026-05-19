import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "../lib/cn";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap border font-medium transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "gap-1 rounded-md border-transparent bg-primary px-2 py-0.5 text-primary-foreground text-xs [&>svg]:size-3 [a&]:hover:bg-primary/90",
        marketing:
          "gap-2 rounded-full border-gray-700 bg-gray-800 px-4 py-2 text-pink-300 text-sm [&>svg]:size-4",
        secondary:
          "gap-1 rounded-md border-transparent bg-secondary px-2 py-0.5 text-secondary-foreground text-xs [&>svg]:size-3 [a&]:hover:bg-secondary/90",
        destructive:
          "gap-1 rounded-md border-transparent bg-destructive px-2 py-0.5 text-white text-xs focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [&>svg]:size-3 [a&]:hover:bg-destructive/90",
        outline:
          "gap-1 rounded-md px-2 py-0.5 text-foreground text-xs [&>svg]:size-3 [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
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
