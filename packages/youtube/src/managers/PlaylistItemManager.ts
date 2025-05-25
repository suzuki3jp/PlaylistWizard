import { Page } from "../Page";
import { PlaylistItem } from "../structures/PlaylistItem";
import { BaseManager } from "./BaseManager";

export class PlaylistItemManager extends BaseManager {
  public async getByPlaylistId(
    playlistId: string,
    pageToken?: string,
  ): Promise<Page<PlaylistItem[]>> {
    return this.client
      .makeOfficialSDKClient()
      .playlistItems.list({
        part: ["id", "contentDetails", "snippet"],
        playlistId,
        maxResults: 50,
        pageToken,
      })
      .then((res) => {
        return new Page<PlaylistItem[]>({
          data: res.data.items?.map((item) => new PlaylistItem(item)) ?? [],
          prevToken: res.data.prevPageToken,
          nextToken: res.data.nextPageToken,
          resultsPerPage: res.data.pageInfo?.resultsPerPage,
          totalResults: res.data.pageInfo?.totalResults,
          getWithToken: this.getByPlaylistId.bind(this, playlistId),
        });
      });
  }
}
