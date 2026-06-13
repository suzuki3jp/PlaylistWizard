import { formatError } from "../../../shared/format-error";
import type { PlaylistProviderGateway } from "../../../usecase/playlist-actions/ports";

export class YouTubePlaylistGateway implements PlaylistProviderGateway {
  async createPlaylist(
    input: Parameters<PlaylistProviderGateway["createPlaylist"]>[0],
  ) {
    let response: Response;
    try {
      response = await fetch(
        "https://www.googleapis.com/youtube/v3/playlists?part=snippet",
        {
          body: JSON.stringify({
            snippet: { title: input.name },
            status: { privacyStatus: input.privacy },
          }),
          headers: {
            Authorization: `Bearer ${input.accessToken}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        },
      );
    } catch (err) {
      throw new Error(
        `YouTube playlist insert request failed: ${formatError(err)}`,
      );
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`YouTube API error: ${response.status} ${text}`);
    }

    return (await response.json()) as { id: string };
  }
}
