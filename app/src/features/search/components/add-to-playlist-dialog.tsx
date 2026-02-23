"use client";

import type { WithT } from "i18next";
import { useState } from "react";
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
import { Provider } from "@/entities/provider";
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

    const allOk = results.every(isOk);
    if (allOk) {
      setMessage({ type: "success", text: t("dialog.success") });
      setSelected(new Set());
      setTimeout(() => {
        setMessage(null);
        onOpenChange(false);
      }, 1500);
    } else {
      setMessage({ type: "error", text: t("dialog.failure") });
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
            <div className="grid grid-cols-2 gap-3 p-1">
              {playlists.map((playlist) => {
                const isSelected = selected.has(playlist.id);
                return (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: TODO
                  // biome-ignore lint/a11y/noStaticElementInteractions: TODO
                  <div
                    key={playlist.id}
                    onClick={() => toggleSelection(playlist.id)}
                    className={`relative cursor-pointer overflow-hidden rounded-lg border transition-all duration-200 ${
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
                      <p className="truncate text-sm text-white">
                        {playlist.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
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
