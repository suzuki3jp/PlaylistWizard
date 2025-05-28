import { Page, type RawPage } from "../Page";
import { Playlist, type RawPlaylist } from "../structures/Playlist";
import { BaseManager } from "./BaseManager";

export class PlaylistManager extends BaseManager {
  public async getMine(): Promise<Page<Playlist>> {
    return this.client
      .fetch<RawPage<RawPlaylist>>("/me/playlists", {
        method: "GET",
        params: {
          limit: "50",
        },
      })
      .then((data) => {
        const playlists = data.items.map((item) => new Playlist(item));
        return new Page<Playlist>(
          {
            ...data,
            items: playlists,
          },
          this.client,
        );
      });
  }
}
