import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

interface UserAvatarProps {
  src: string;
  alt: string;
  className?: string;
}

export function UserAvatar({ src, alt, className }: UserAvatarProps) {
  return (
    <Avatar className={cn("h-10 w-10", className)}>
      <AvatarImage src={src} alt={alt} />
    </Avatar>
  );
}
