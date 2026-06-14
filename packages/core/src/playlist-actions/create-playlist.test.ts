import { describe, expect, it } from "vitest";
import { toPlaylistId, toVideoId } from "../ids";
import { PlaylistPrivacy } from "../playlist";
import {
  planAddPlaylistItemsAfterCreate,
  planCreatePlaylistOperation,
} from "./create-playlist";

describe("planCreatePlaylistOperation", () => {
  it("plans the Provider playlist creation operation from user-visible input", () => {
    expect(
      planCreatePlaylistOperation({
        name: "New playlist",
        privacy: PlaylistPrivacy.Private,
      }),
    ).toEqual({
      name: "New playlist",
      privacy: "private",
    });
  });
});

describe("planAddPlaylistItemsAfterCreate", () => {
  it("plans item additions against the created Playlist", () => {
    const playlistId = toPlaylistId("playlist-id");
    const firstVideoId = toVideoId("first-video-id");
    const secondVideoId = toVideoId("second-video-id");

    expect(
      planAddPlaylistItemsAfterCreate({
        createdPlaylistId: playlistId,
        items: [{ videoId: firstVideoId }, { videoId: secondVideoId }],
      }),
    ).toEqual([
      { playlistId, videoId: firstVideoId },
      { playlistId, videoId: secondVideoId },
    ]);
  });

  it("keeps an empty follow-up plan empty", () => {
    expect(
      planAddPlaylistItemsAfterCreate({
        createdPlaylistId: toPlaylistId("playlist-id"),
        items: [],
      }),
    ).toEqual([]);
  });
});
