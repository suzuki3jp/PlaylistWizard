import { toPlaylistId, toVideoId } from "@playlistwizard/core/ids";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NonRetryableError } from "../../../shared/non-retryable-error";
import {
  isPermanentYouTubeError,
  YouTubePlaylistGateway,
} from "./youtube-playlist-gateway";

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

  it("reads Video IDs across every playlist item page", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (url) => {
      const pageToken = new URL(String(url)).searchParams.get("pageToken");
      return pageToken === "page-2"
        ? Response.json({
            items: [{ contentDetails: { videoId: "video-3" } }],
          })
        : Response.json({
            items: [
              { contentDetails: { videoId: "video-1" } },
              { contentDetails: { videoId: "video-2" } },
            ],
            nextPageToken: "page-2",
          });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      new YouTubePlaylistGateway().listPlaylistVideoIds({
        accessToken: "access-token",
        playlistId: toPlaylistId("playlist-id"),
      }),
    ).resolves.toEqual(["video-1", "video-2", "video-3"]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(firstUrl.pathname).toBe("/youtube/v3/playlistItems");
    expect(firstUrl.searchParams.get("playlistId")).toBe("playlist-id");
    expect(firstUrl.searchParams.get("maxResults")).toBe("50");
    expect(firstUrl.searchParams.has("pageToken")).toBe(false);
  });

  it("inserts a Video into a Playlist and returns the Playlist Item ID", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Response.json({ id: "playlist-item-id" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      new YouTubePlaylistGateway().addPlaylistItem({
        accessToken: "access-token",
        playlistId: toPlaylistId("playlist-id"),
        videoId: toVideoId("video-id"),
      }),
    ).resolves.toEqual({ id: "playlist-item-id" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(new URL(String(url)).pathname).toBe("/youtube/v3/playlistItems");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      snippet: {
        playlistId: "playlist-id",
        resourceId: { kind: "youtube#video", videoId: "video-id" },
      },
    });
  });

  it("throws NonRetryableError for errors a retry cannot fix", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(
        async () => new Response("playlistNotFound", { status: 404 }),
      ),
    );

    await expect(
      new YouTubePlaylistGateway().listPlaylistVideoIds({
        accessToken: "access-token",
        playlistId: toPlaylistId("missing"),
      }),
    ).rejects.toBeInstanceOf(NonRetryableError);
  });
});

describe("isPermanentYouTubeError", () => {
  const forbidden = (reason: string) =>
    JSON.stringify({ error: { code: 403, errors: [{ reason }] } });

  it("treats invalid, missing, and forbidden resources as permanent", () => {
    expect(isPermanentYouTubeError(400, "")).toBe(true);
    expect(isPermanentYouTubeError(404, "")).toBe(true);
    expect(isPermanentYouTubeError(403, forbidden("forbidden"))).toBe(true);
    expect(isPermanentYouTubeError(403, "not json")).toBe(true);
  });

  it("keeps quota, throttling, auth, and server errors retryable", () => {
    expect(isPermanentYouTubeError(403, forbidden("quotaExceeded"))).toBe(
      false,
    );
    expect(isPermanentYouTubeError(403, forbidden("rateLimitExceeded"))).toBe(
      false,
    );
    expect(isPermanentYouTubeError(401, "")).toBe(false);
    expect(isPermanentYouTubeError(409, "")).toBe(false);
    expect(isPermanentYouTubeError(429, "")).toBe(false);
    expect(isPermanentYouTubeError(503, "")).toBe(false);
  });
});
