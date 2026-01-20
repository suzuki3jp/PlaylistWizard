import type { Playlist } from "@/features/playlist/entities";

export interface Repository {
  getMyPlaylists(): Promise<Playlist[]>;
}
