"use client";
import { Megaphone as AnnouncementIcon, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { CenteredLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { announcementDismissedCookie } from "../constants";

type AnnouncementBannerProps = {
  /**
   * Unique id for the announcement
   * Used to track if the user has dismissed the banner
   */
  annoucementKey: string;

  label: ReactNode;
};

/**
 * Dismissable announcement bar shown at the very top of the page.
 *
 * Whether the banner should be rendered at all is decided on the server from
 * the dismissal cookie (see {@link announcementDismissedCookie}); this
 * component only handles hiding it within the current page after the user
 * dismisses it.
 */
export default function AnnouncementBanner({
  annoucementKey,
  label,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  function dismiss() {
    // One year is effectively "forever" for an announcement: each new
    // announcement uses a new key, so an expired cookie never resurfaces
    // an old banner.
    document.cookie = `${announcementDismissedCookie(annoucementKey)}=1; path=/; max-age=31536000; samesite=lax`;
    setDismissed(true);
  }

  return (
    <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white">
      <CenteredLayout direction="x">
        <div className="flex w-full items-center justify-between px-6 py-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AnnouncementIcon className="h-4 w-4" />
            <span>{label}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismiss}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CenteredLayout>
    </div>
  );
}
