import { google } from "googleapis";

import { PlaylistItemManager } from "./managers/PlaylistItemManager";
import { PlaylistManager } from "./managers/PlaylistManager";

export type ApiClientOptions = {
  /**
   * The access token to authenticate with the YouTube API for OAuth flow.
   */
  accessToken: string;
};

/**
 * The ApiClient class to interact with the YouTube API v3.
 */
export class ApiClient {
  public readonly playlist: PlaylistManager;
  public readonly playlistItem: PlaylistItemManager;

  constructor(private options: ApiClientOptions) {
    this.playlist = new PlaylistManager(this);
    this.playlistItem = new PlaylistItemManager(this);
  }

  /**
   * Makes an official SDK client for the YouTube API v3.
   * @internal
   */
  public makeOfficialSDKClient() {
    const oauth = new google.auth.OAuth2();
    oauth.setCredentials({
      access_token: this.options.accessToken,
    });

    return google.youtube({
      version: "v3",
      auth: oauth,
    });
  }
}
