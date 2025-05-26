import { Page } from "../Page";
import { PlaylistItem } from "../structures/PlaylistItem";
import { BaseManager } from "./BaseManager";

const requiredParts = ["id", "contentDetails", "snippet"];
export class PlaylistItemManager extends BaseManager {
  public async getByPlaylistId(
    playlistId: string,
    pageToken?: string,
  ): Promise<Page<PlaylistItem[]>> {
    return this.client
      .makeOfficialSDKClient()
      .playlistItems.list({
        part: requiredParts,
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

  /**
   * Creates a new playlist item in the specified playlist.
   * @param playlistId
   * @param videoId
   * @returns
   */
  public async create(
    playlistId: string,
    videoId: string,
  ): Promise<PlaylistItem> {
    return this.client
      .makeOfficialSDKClient()
      .playlistItems.insert({
        part: requiredParts,
        requestBody: {
          snippet: {
            playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId,
            },
          },
        },
      })
      .then((res) => new PlaylistItem(res.data));
  }
}
