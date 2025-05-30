import { cn } from "@/lib/utils";
import { Link, type LinkProps } from "@/presentation/common/link";

export function HighlightedLink(props: LinkProps) {
  const defaultStyle = "text-pink-400 hover:text-pink-300";
  return (
    <Link className={cn(defaultStyle, props.className)} underline {...props} />
  );
}
