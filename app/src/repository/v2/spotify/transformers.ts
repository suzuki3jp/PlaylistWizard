import { Provider } from "@/entities/provider";
import type { Playlist, PlaylistItem } from "@/features/playlist/entities";
import type { SpotifyImage } from "./schemas/image";
import type { SpotifyFullPlaylist, SpotifyPlaylist } from "./schemas/playlist";
import type { SpotifyPlaylistTrack } from "./schemas/track";

const SPOTIFY_DEFAULT_THUMBNAIL =
  "https://dummyimage.com/600x400/8f8f8f/8f8f8f";

export function transformPlaylist(playlist: SpotifyPlaylist): Playlist {
  return {
    id: playlist.id,
    title: playlist.name,
    thumbnailUrl: extractThumbnailUrl(playlist.images, "largest"),
    itemsTotal: playlist.tracks.total,
    url: playlist.external_urls.spotify,
    provider: Provider.SPOTIFY,
  };
}

export function transformFullPlaylistToPlaylist(
  playlist: SpotifyFullPlaylist,
): Playlist {
  return {
    id: playlist.id,
    title: playlist.name,
    thumbnailUrl: extractThumbnailUrl(playlist.images, "largest"),
    itemsTotal: playlist.tracks.total,
    url: playlist.external_urls.spotify,
    provider: Provider.SPOTIFY,
  };
}

export function transformPlaylistTrack(
  track: SpotifyPlaylistTrack,
  position: number,
): PlaylistItem | null {
  if (!track.track) {
    return null;
  }

  return {
    id: track.track.id,
    title: track.track.name,
    thumbnailUrl: extractThumbnailUrl(track.track.album.images, "smallest"),
    position,
    author: track.track.artists.map((a) => a.name).join(" & "),
    videoId: track.track.id,
    url: track.track.external_urls.spotify,
  };
}

type ThumbnailSize = "largest" | "smallest";

function extractThumbnailUrl(
  images: SpotifyImage[] | null,
  size: ThumbnailSize,
): string {
  if (!images || images.length === 0) {
    return SPOTIFY_DEFAULT_THUMBNAIL;
  }

  const sorted = [...images].sort((a, b) => {
    const aSize = (a.width ?? 0) * (a.height ?? 0);
    const bSize = (b.width ?? 0) * (b.height ?? 0);
    return size === "largest" ? bSize - aSize : aSize - bSize;
  });

  return sorted[0]?.url ?? SPOTIFY_DEFAULT_THUMBNAIL;
}
