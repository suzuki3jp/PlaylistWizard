import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
import type { Playlist } from "@/features/playlist/entities";
import { PlaylistTreeNodePreview } from "./playlist-tree-node-preview";

export interface PlaylistTreePreviewProps {
  definition: StructuredPlaylistsDefinition;
  playlists: Playlist[];
  unknownPlaylistLabel: string;
}

export function PlaylistTreePreview({
  definition,
  playlists,
  unknownPlaylistLabel,
}: PlaylistTreePreviewProps) {
  return (
    <div className="max-h-64 space-y-2 overflow-y-auto">
      {definition.playlists.map((playlistDef, index) => (
        <PlaylistTreeNodePreview
          key={`${playlistDef.id}-${index}`}
          playlistDef={playlistDef}
          playlists={playlists}
          depth={0}
          unknownPlaylistLabel={unknownPlaylistLabel}
        />
      ))}
    </div>
  );
}
