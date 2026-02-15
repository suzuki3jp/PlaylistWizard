"use client";

import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/presentation/hooks/useAuth";
import { LanguageRadioUserMenuItem, SignOutUserMenuItem } from "./menu-items";
import { UserAvatar } from "./user-avatar";

export function UserMenu() {
  const auth = useAuth();

  const userImage = auth?.user?.image;
  const userName = auth?.user?.name;
  if (!userImage || !userName) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar
          src={userImage}
          alt={`${userName}'s avatar`}
          className="cursor-pointer"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 border-gray-800 bg-black text-white"
        align="start"
      >
        <div className="mt-4 space-y-3 px-2 py-1.5 font-bold">
          <Image
            src={userImage}
            width={64}
            height={64}
            alt={`${userName}'s avatar`}
            priority
          />
          <p>{userName}</p>
        </div>
        <DropdownMenuSeparator className="bg-gray-800" />
        <DropdownMenuGroup>
          <LanguageRadioUserMenuItem />
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-gray-800" />
        <SignOutUserMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
