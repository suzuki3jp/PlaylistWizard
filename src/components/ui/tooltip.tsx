"use client";
import type React from "react";

import {
    TooltipContent,
    Tooltip as TooltipPrimitive,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/shadcn-ui/tooltip";

/**
 * The Tooltip component.
 * It is a wrapper around the `shadcn-ui/tooltip` component.
 * @param param0
 * @returns
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
    return (
        <TooltipProvider>
            <TooltipPrimitive>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent>{content}</TooltipContent>
            </TooltipPrimitive>
        </TooltipProvider>
    );
};

type TooltipProps = Readonly<{
    content: React.ReactNode;
    children: React.ReactNode;
}>;
