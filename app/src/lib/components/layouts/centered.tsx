import { cn } from "@/presentation/common/cn";
import type { PropsWithChildren } from "react";

type CenteredLayoutProps = {
  direction: "x" | "y" | "xy";
  className?: string;
} & PropsWithChildren;

export function CenteredLayout({
  children,
  direction,
  className,
}: CenteredLayoutProps) {
  // direction に基づく中央揃えスタイル
  const getAlignmentClasses = () => {
    switch (direction) {
      case "x":
        return "flex items-stretch justify-center"; // 左右中央揃え
      case "y":
        return "flex flex-col justify-center items-stretch"; // 上下中央揃え
      case "xy":
        return "flex items-center justify-center"; // 縦横中央揃え
      default:
        return "";
    }
  };

  const classes = cn("h-full w-full", getAlignmentClasses(), className);

  return <div className={classes}>{children}</div>;
}
