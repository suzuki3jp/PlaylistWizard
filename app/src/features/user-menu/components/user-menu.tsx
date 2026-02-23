"use client";

import Image from "next/image";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FeedbackDialog } from "@/features/feedback/components/feedback-dialog";
import { useSession } from "@/lib/auth-client";
import {
  FeedbackUserMenuItem,
  LanguageRadioUserMenuItem,
  SettingsUserMenuItem,
  SignOutUserMenuItem,
} from "./menu-items";
import { UserAvatar } from "./user-avatar";

export function UserMenu() {
  const { data: session } = useSession();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const userImage = session?.user?.image;
  const userName = session?.user?.name;
  if (!userImage || !userName) return null;

  return (
    <>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
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
            <SettingsUserMenuItem />
            <FeedbackUserMenuItem onSelect={() => setFeedbackOpen(true)} />
            <LanguageRadioUserMenuItem />
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="bg-gray-800" />
          <SignOutUserMenuItem />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
