import { Avatar, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  src: string;
  alt: string;
  className?: string;
}

export function UserAvatar({ src, alt, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      <AvatarImage src={src} alt={alt} />
    </Avatar>
  );
}
