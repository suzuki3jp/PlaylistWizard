"use client";

import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChangelogUserMenuItem,
  FaqUserMenuItem,
  FeaturesUserMenuItem,
  GitHubUserMenuItem,
  LanguageRadioUserMenuItem,
  PlaylistsUserMenuItem,
  SignInUserMenuItem,
  StructuredPlaylistUserMenuItem,
} from "./menu-items";
import { UserAvatar } from "./user-avatar";

export function NonSignedInUserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar
          src="/assets/unknown-user.png"
          alt="Unknown user's avatar"
          className="cursor-pointer"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 border-gray-800 bg-black text-white"
        align="start"
      >
        <div className="mt-4 space-y-3 px-2 py-1.5 font-bold">
          <Image
            src={"/assets/unknown-user.png"}
            width={64}
            height={64}
            alt="Unknown user's avatar"
            priority
          />
          <p>Unknown User</p>
        </div>
        <DropdownMenuSeparator className="bg-gray-800" />
        <DropdownMenuGroup>
          <FeaturesUserMenuItem />
          <FaqUserMenuItem />
          <PlaylistsUserMenuItem />
          <StructuredPlaylistUserMenuItem />
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-gray-800" />
        <DropdownMenuGroup>
          <LanguageRadioUserMenuItem />
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-gray-800" />
        <GitHubUserMenuItem />
        <ChangelogUserMenuItem />

        <DropdownMenuSeparator className="bg-gray-800" />
        <SignInUserMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
