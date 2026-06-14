import { afterEach, describe, expect, it, vi } from "vitest";
import { YouTubePlaylistGateway } from "./youtube-playlist-gateway";

describe("YouTubePlaylistGateway", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates playlists with the status part when setting privacy", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Response.json({ id: "created-playlist-id" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const gateway = new YouTubePlaylistGateway();

    await expect(
      gateway.createPlaylist({
        accessToken: "access-token",
        name: "New playlist",
        privacy: "private",
      }),
    ).resolves.toEqual({ id: "created-playlist-id" });

    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0];
    const requestUrl = new URL(String(url));
    expect(requestUrl.origin).toBe("https://www.googleapis.com");
    expect(requestUrl.pathname).toBe("/youtube/v3/playlists");
    expect(requestUrl.searchParams.get("part")).toBe("id,snippet,status");
    expect(init).toMatchObject({
      headers: {
        Authorization: "Bearer access-token",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      snippet: { title: "New playlist" },
      status: { privacyStatus: "private" },
    });
  });

  it("preserves YouTube API error details", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response("bad part", { status: 400 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const gateway = new YouTubePlaylistGateway();

    await expect(
      gateway.createPlaylist({
        accessToken: "access-token",
        name: "New playlist",
        privacy: "private",
      }),
    ).rejects.toThrow("YouTube API error: 400 bad part");
  });
});
