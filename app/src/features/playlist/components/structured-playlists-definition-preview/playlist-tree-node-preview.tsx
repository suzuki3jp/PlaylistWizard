"use client";
import { ChevronDown, ChevronRight, Music, TriangleAlert } from "lucide-react";
import { ThumbnailImage } from "@/components/thumbnail-image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Playlist } from "@/features/playlist/entities";
import type { PlaylistDefinition } from "../../utils/structured-playlists-definition-stats";

export interface PlaylistTreeNodePreviewProps {
  playlistDef: PlaylistDefinition;
  playlists: Playlist[];
  depth: number;
  unknownPlaylistLabel: string;
}

export function PlaylistTreeNodePreview({
  playlistDef,
  playlists,
  depth,
  unknownPlaylistLabel,
}: PlaylistTreeNodePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const playlist = playlists.find((p) => p.id === playlistDef.id);
  const hasChildren =
    playlistDef.dependencies && playlistDef.dependencies.length > 0;
  const indentSize = depth * 16;

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 rounded-md bg-gray-800/50 p-2"
        style={{ marginLeft: indentSize }}
      >
        {hasChildren ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="h-6 w-6" />
        )}

        {playlist ? (
          <>
            <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded">
              <ThumbnailImage
                src={playlist.thumbnailUrl}
                alt={playlist.title}
                fill
                className="object-cover"
              />
            </div>
            <span className="min-w-0 flex-1 truncate text-sm text-white">
              {playlist.title}
            </span>
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Music className="h-3 w-3" />
              <span>{playlist.itemsTotal}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-yellow-900/50">
              <TriangleAlert className="h-4 w-4 text-yellow-500" />
            </div>
            <span className="min-w-0 flex-1 truncate text-sm text-yellow-400">
              {unknownPlaylistLabel}
            </span>
            <span className="text-gray-500 text-xs">{playlistDef.id}</span>
          </>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {playlistDef.dependencies?.map((childDef, index) => (
            <PlaylistTreeNodePreview
              key={`${childDef.id}-${index}`}
              playlistDef={childDef}
              playlists={playlists}
              depth={depth + 1}
              unknownPlaylistLabel={unknownPlaylistLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
