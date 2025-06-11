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

  /**
   * Deletes a playlist item by its ID.
   * @param itemId
   * @returns
   */
  public async delete(itemId: string): Promise<void> {
    return this.client
      .makeOfficialSDKClient()
      .playlistItems.delete({
        id: itemId,
      })
      .then(() => {});
  }

  public async updatePosition(
    playlistId: string,
    itemId: string,
    resourceId: string,
    position: number,
  ): Promise<PlaylistItem> {
    return this.client
      .makeOfficialSDKClient()
      .playlistItems.update({
        part: requiredParts,
        requestBody: {
          id: itemId,
          snippet: {
            playlistId,
            position,
            resourceId: {
              kind: "youtube#video",
              videoId: resourceId,
            },
          },
        },
      })
      .then((res) => new PlaylistItem(res.data));
  }
}
