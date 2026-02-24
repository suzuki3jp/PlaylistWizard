"use client";

import type { WithT } from "i18next";
import { ListPlus } from "lucide-react";
import { useState } from "react";
import { Link } from "@/components/link";
import { ThumbnailImage } from "@/components/thumbnail-image";
import { Button } from "@/components/ui/button";
import { urls } from "@/constants";
import type { VideoSearchResult } from "../entities";
import { AddToPlaylistDialog } from "./add-to-playlist-dialog";

interface SearchResultCardProps {
  video: VideoSearchResult;
}

function formatViewCount(count: string): string {
  const num = Number.parseInt(count, 10);
  if (Number.isNaN(num)) return count;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

function formatDuration(iso: string): string {
  if (!iso || iso === "PT" || iso === "P0D") return "0:00";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match || (!match[1] && !match[2] && !match[3])) return "0:00";
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

export function SearchResultCard({ video, t }: SearchResultCardProps & WithT) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Link
        href={urls.youtubeWatch(video.id)}
        openInNewTab
        className="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-900 p-3 transition-colors hover:border-gray-700 hover:bg-gray-800/80"
      >
        <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-md">
          <ThumbnailImage
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
          />
          <span className="absolute right-1 bottom-1 rounded bg-black/80 px-1 py-0.5 text-white text-xs">
            {formatDuration(video.duration)}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="line-clamp-2 font-medium text-sm text-white">
            {video.title}
          </h3>
          <p className="text-gray-400 text-xs">{video.channelTitle}</p>
          <p className="text-gray-500 text-xs">
            {t("result.views", {
              viewCount: formatViewCount(video.viewCount),
            })}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            setDialogOpen(true);
          }}
          aria-label={t("result.add-to-playlist")}
          className="flex-shrink-0 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <ListPlus className="h-5 w-5" />
        </Button>
      </Link>

      <AddToPlaylistDialog
        video={video}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        t={t}
      />
    </>
  );
}
