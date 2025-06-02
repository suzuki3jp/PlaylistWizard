"use client";
import { Button, type ButtonProps } from "@/presentation/shadcn/button";
import { cn } from "./cn";

export function GradientButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        className,
        "bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700",
      )}
      {...props}
    />
  );
}
