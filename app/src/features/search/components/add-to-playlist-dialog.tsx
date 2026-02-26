"use client";

import type { WithT } from "i18next";
import { Fragment, useState } from "react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { ThumbnailImage } from "@/components/thumbnail-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ga4Events } from "@/constants";
import { Provider } from "@/entities/provider";
import { usePinnedPlaylists } from "@/features/pinned-playlists/provider";
import type { Playlist } from "@/features/playlist/entities";
import { usePlaylistsQuery } from "@/features/playlist/queries/use-playlists";
import { addPlaylistItem } from "@/usecase/actions/add-playlist-item";
import { isOk } from "@/usecase/actions/plain-result";
import type { VideoSearchResult } from "../entities";

interface AddToPlaylistDialogProps {
  video: VideoSearchResult;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToPlaylistDialog({
  video,
  open,
  onOpenChange,
  t,
}: AddToPlaylistDialogProps & WithT) {
  const { data: playlists, isPending } = usePlaylistsQuery();
  const { pinnedIds } = usePinnedPlaylists();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const toggleSelection = (playlistId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(playlistId)) {
        next.delete(playlistId);
      } else {
        next.add(playlistId);
      }
      return next;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    setIsSubmitting(true);
    setMessage(null);

    const results = await Promise.all(
      Array.from(selected).map((playlistId) =>
        addPlaylistItem({
          playlistId,
          resourceId: video.id,
          repository: Provider.GOOGLE,
        }),
      ),
    );

    setIsSubmitting(false);

    const successCount = results.filter(isOk).length;
    const total = results.length;

    if (successCount === total) {
      emitGa4Event(ga4Events.searchAddToPlaylist);
      setMessage({ type: "success", text: t("dialog.success") });
      setSelected(new Set());
      setTimeout(() => {
        setMessage(null);
        onOpenChange(false);
      }, 1500);
    } else if (successCount === 0) {
      setMessage({ type: "error", text: t("dialog.failure") });
    } else {
      setMessage({
        type: "error",
        text: t("dialog.partial-failure", { successCount, total }),
      });
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelected(new Set());
      setMessage(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border border-gray-800 bg-gray-900 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("dialog.title")}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {t("dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 overflow-y-auto">
          {isPending ? (
            <p className="py-4 text-center text-gray-400 text-sm">
              {t("dialog.loading")}
            </p>
          ) : !playlists || playlists.length === 0 ? (
            <p className="py-4 text-center text-gray-400 text-sm">
              {t("dialog.empty-playlists")}
            </p>
          ) : (
            <SortedPlaylistGrid
              playlists={playlists}
              pinnedIds={pinnedIds}
              selected={selected}
              onToggle={toggleSelection}
            />
          )}
        </div>

        {message && (
          <p
            className={`text-sm ${message.type === "success" ? "text-green-400" : "text-red-400"}`}
          >
            {message.text}
          </p>
        )}

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
          >
            {t("dialog.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={selected.size === 0 || isSubmitting}
            className="bg-pink-600 text-white hover:bg-pink-700"
          >
            {t("dialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SortedPlaylistGridProps {
  playlists: Playlist[];
  pinnedIds: string[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

function SortedPlaylistGrid({
  playlists,
  pinnedIds,
  selected,
  onToggle,
}: SortedPlaylistGridProps) {
  const pinnedSet = new Set(pinnedIds);
  const sorted = [...playlists].sort((a, b) => {
    const aPinned = pinnedSet.has(a.id);
    const bPinned = pinnedSet.has(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });
  let pinnedCount = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (pinnedSet.has(sorted[i].id)) {
      pinnedCount++;
    } else {
      break;
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-1">
      {sorted.map((playlist, index) => {
        const isSelected = selected.has(playlist.id);
        return (
          <Fragment key={playlist.id}>
            {index === pinnedCount && pinnedCount > 0 && (
              <hr className="col-span-2 border-gray-700" />
            )}
            <button
              type="button"
              onClick={() => onToggle(playlist.id)}
              className={`relative w-full cursor-pointer overflow-hidden rounded-lg border text-left transition-all duration-200 ${
                isSelected
                  ? "border-pink-500 bg-gray-800"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              <div className="relative aspect-video overflow-hidden rounded-t-lg">
                <ThumbnailImage
                  src={playlist.thumbnailUrl}
                  alt={playlist.title}
                  fill
                  className="object-cover"
                />
                {isSelected && (
                  <div className="absolute top-1.5 left-1.5 rounded-full bg-pink-500 p-0.5">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <title>selected</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="truncate text-sm text-white">{playlist.title}</p>
              </div>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
