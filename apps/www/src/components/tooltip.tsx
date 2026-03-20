import type { PropsWithChildren } from "react";

import * as Shadcn from "@/components/ui/tooltip";

export type TooltipProps = { description: string } & PropsWithChildren &
  React.HTMLAttributes<HTMLDivElement>;

/**
 * The Tooltip component that wraps shadcn-ui's Tooltip components.
 * @param param0
 * @returns
 */
export function Tooltip({ description, children, ...props }: TooltipProps) {
  return (
    <Shadcn.TooltipProvider>
      <Shadcn.Tooltip>
        <Shadcn.TooltipTrigger asChild>{children}</Shadcn.TooltipTrigger>
        <Shadcn.TooltipContent {...props}>
          <p>{description}</p>
        </Shadcn.TooltipContent>
      </Shadcn.Tooltip>
    </Shadcn.TooltipProvider>
  );
}
