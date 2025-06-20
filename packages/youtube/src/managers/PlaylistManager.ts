import { Page } from "../Page";
import { Playlist, type PlaylistPrivacyStatus } from "../structures/Playlist";
import { BaseManager } from "./BaseManager";

const requiredParts = ["id", "contentDetails", "snippet"];

export class PlaylistManager extends BaseManager {
  public async getMine(pageToken?: string): Promise<Page<Playlist[]>> {
    return this.client
      .makeOfficialSDKClient()
      .playlists.list({
        part: requiredParts,
        mine: true,
        maxResults: 50,
        pageToken,
      })
      .then((res) => {
        return new Page<Playlist[]>({
          data: res.data.items?.map((item) => new Playlist(item)) ?? [],
          prevToken: res.data.prevPageToken,
          nextToken: res.data.nextPageToken,
          resultsPerPage: res.data.pageInfo?.resultsPerPage,
          totalResults: res.data.pageInfo?.totalResults,
          getWithToken: this.getMine.bind(this),
        });
      });
  }

  /**
   * Gets a playlist by its ID.
   * @param id
   * @returns
   */
  public async getById(id: string): Promise<Playlist | null> {
    return this.client
      .makeOfficialSDKClient()
      .playlists.list({
        part: requiredParts,
        id: [id],
      })
      .then((res) => {
        if (res.data.items && res.data.items.length > 0) {
          return new Playlist(res.data.items[0]);
        }
        return null;
      });
  }

  public async create({
    title,
    privacy,
  }: {
    title: string;
    privacy: PlaylistPrivacyStatus;
  }): Promise<Playlist> {
    return this.client
      .makeOfficialSDKClient()
      .playlists.insert({
        part: [...requiredParts, "status"],
        requestBody: {
          snippet: {
            title,
          },
          status: {
            privacyStatus: privacy,
          },
        },
      })
      .then((res) => {
        return new Playlist(res.data);
      });
  }

  /**
   * Deletes a playlist by its ID.
   * @param id
   * @returns
   */
  public async delete(id: string): Promise<number> {
    return this.client
      .makeOfficialSDKClient()
      .playlists.delete({
        id,
      })
      .then((res) => {
        return res.status;
      });
  }
}
