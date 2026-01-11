"use client";
import { Megaphone as AnnouncementIcon, X } from "lucide-react";
import type { ReactNode } from "react";
import { useLocalStorage } from "usehooks-ts";
import { CenteredLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";

type AnnouncementBannerProps = {
  /**
   * Unique key for the announcement
   * Used to track if the user has dismissed the banner
   */
  key: string;

  label: ReactNode;
};

export default function AnnouncementBanner({
  key,
  label,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useLocalStorage(
    `announcement-${key}-dismissed`,
    false,
  );
  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white">
      <CenteredLayout direction="x">
        <div className="container flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-2 font-medium text-sm">
            <AnnouncementIcon className="h-4 w-4" />
            <span>{label}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CenteredLayout>
    </div>
  );
}
