import { google, type youtube_v3 } from "googleapis";

/**
 * A client for interacting with the YouTube Data API v3 used in PlaylistWizard.
 */
export class YouTubeApiClient {
  async getPlaylistItemsByPlaylistId(
    playlistId: string,
    accessToken: string,
    nextPageToken?: string,
  ) {
    const client = this.getClient(accessToken);

    const res = await client.playlistItems.list({
      part: ["id", "contentDetails", "snippet", "status"],
      playlistId,
      maxResults: 50,
      pageToken: nextPageToken,
    });
    return res.data;
  }

  async getPlaylistByPlaylistId(playlistId: string, accessToken: string) {
    const client = this.getClient(accessToken);
    const res = await client.playlists.list({
      part: [
        "id",
        "contentDetails",
        "localizations",
        "player",
        "snippet",
        "status",
      ],
      id: [playlistId],
      maxResults: 1,
    });

    return res.data;
  }

  async getPlaylists(accessToken: string, pageToken?: string) {
    const client = this.getClient(accessToken);
    const res = await client.playlists.list({
      part: [
        "id",
        "contentDetails",
        "localizations",
        "player",
        "snippet",
        "status",
      ],
      mine: true,
      maxResults: 50,
      pageToken,
    });

    return res.data;
  }

  async addPlaylist(
    title: string,
    status: "private" | "public" | "unlisted",
    accessToken: string,
  ) {
    const client = this.getClient(accessToken);
    const res = await client.playlists.insert({
      part: ["id", "contentDetails", "player", "snippet", "status"],
      requestBody: {
        snippet: {
          title,
        },
        status: {
          privacyStatus: status,
        },
      },
    });
    return res.data;
  }

  async deletePlaylist(playlistId: string, accessToken: string) {
    const client = this.getClient(accessToken);
    const res = await client.playlists.delete({ id: playlistId });
    return res.status;
  }

  async addPlaylistItem(
    playlistId: string,
    resourceId: string,
    accessToken: string,
  ) {
    const client = this.getClient(accessToken);
    const res = await client.playlistItems.insert({
      part: ["id", "contentDetails", "snippet", "status"],
      requestBody: {
        snippet: {
          playlistId,
          resourceId: {
            kind: "youtube#video",
            videoId: resourceId,
          },
        },
      },
    });
    return res.data;
  }

  async updatePlaylistItem(
    itemId: string,
    playlistId: string,
    resourceId: string,
    position: number,
    accessToken: string,
  ) {
    const client = this.getClient(accessToken);
    const res = await client.playlistItems.update({
      part: ["id", "snippet", "contentDetails", "status"],
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
    });
    return res.data;
  }

  private getClient(accessToken: string): youtube_v3.Youtube {
    const oauth = new google.auth.OAuth2();
    oauth.setCredentials({
      access_token: accessToken,
    });

    return google.youtube({ version: "v3", auth: oauth });
  }
}
