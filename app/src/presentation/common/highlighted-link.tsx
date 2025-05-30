import { Link, type LinkProps } from "@/components/link";
import { cn } from "@/lib/utils";

export function HighlightedLink(props: LinkProps) {
  const defaultStyle = "text-pink-400 hover:text-pink-300";
  return (
    <Link {...props} className={cn(defaultStyle, props.className)} underline />
  );
}
