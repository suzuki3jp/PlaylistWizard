"use client";

import Image from "next/image";
import Link, { type LinkProps } from "next/link";
import type { PropsWithChildren } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { urls } from "@/constants";
import { useLang } from "@/features/localization/atoms/lang";
import { useAuth } from "@/presentation/hooks/useAuth";
import { UserAvatar } from "./user-avatar";

// TODO: dipslay menu for non-logged-in users
export function UserMenu() {
  const [lang] = useLang();
  const auth = useAuth();

  const userImage = auth?.user?.image;
  const userName = auth?.user?.name;
  if (!userImage || !userName) return null; // no user menu if not logged in or no user info

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
          <DropdownMenuLinkItem href={urls.homeFeatures(lang)}>
            Features
          </DropdownMenuLinkItem>
          <DropdownMenuLinkItem href={urls.homeFaq(lang)}>
            FAQ
          </DropdownMenuLinkItem>
          <DropdownMenuLinkItem href={urls.playlists()}>
            Playlists
          </DropdownMenuLinkItem>
          <DropdownMenuLinkItem href={urls.structuredPlaylistsEditor(lang)}>
            Structured Playlists
          </DropdownMenuLinkItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-gray-800" />
        <DropdownMenuGroup>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Message</DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem>More...</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem>
            New Team
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-gray-800" />
        <DropdownMenuItem>GitHub</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuItem disabled>API</DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-800" />
        <DropdownMenuLinkItem href={urls.signOut(lang, "/")}>
          Log out
        </DropdownMenuLinkItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuLinkItem({
  children,
  ...props
}: PropsWithChildren<LinkProps>) {
  return (
    <DropdownMenuItem asChild>
      <Link {...props}>{children}</Link>
    </DropdownMenuItem>
  );
}
