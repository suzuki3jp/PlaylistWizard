import { Link, type LinkProps } from "@/components/link";

export function HighlightedLink(props: LinkProps) {
  return (
    <Link {...props} className="text-pink-400 hover:text-pink-300" underline />
  );
}
