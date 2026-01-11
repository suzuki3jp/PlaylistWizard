import { cn } from "@/lib/cn";
import { Link, type LinkProps } from "@/presentation/common/link";

export function HighlightedLink({ className, ...props }: LinkProps) {
  const defaultStyle = "text-pink-400 hover:text-pink-300";
  return <Link className={cn(defaultStyle, className)} underline {...props} />;
}
