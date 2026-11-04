import { describe, expect, it } from "vitest";
import { type PlaylistId, toPlaylistId, toVideoId, type VideoId } from "../ids";
import {
  planStructuredPlaylistsSyncSteps,
  type StructuredPlaylistsDefinition,
} from "../structured-playlists";
import {
  listSyncPlaylistIds,
  planSyncAddPlaylistItems,
} from "./sync-structured-playlists";

const definitionOf = (
  playlists: StructuredPlaylistsDefinition["playlists"],
): StructuredPlaylistsDefinition => ({
  version: 1,
  name: "Definition",
  provider: "google",
  playlists,
});

const videoIdsOf = (
  entries: Record<string, string[]>,
): Map<PlaylistId, VideoId[]> =>
  new Map(
    Object.entries(entries).map(([playlistId, videoIds]) => [
      toPlaylistId(playlistId),
      videoIds.map(toVideoId),
    ]),
  );

/**
 * Runs the legacy planner with item objects, as the in-browser Sync does, so
 * the Job planner can be checked against the same rules.
 */
const planWithLegacyItems = (
  definition: StructuredPlaylistsDefinition,
  entries: Record<string, string[]>,
) =>
  planStructuredPlaylistsSyncSteps({
    playlists: definition.playlists,
    playlistsMap: new Map(
      Object.entries(entries).map(([playlistId, videoIds]) => [
        playlistId,
        videoIds.map((videoId, index) => ({
          id: `${playlistId}-item-${index}`,
          videoId,
        })),
      ]),
    ),
    getItems: (items) => items,
    getVideoId: (item) => item.videoId,
    toPlaylistId: (playlistId) => playlistId,
  }).map((step) => ({
    playlistId: step.playlistId,
    videoId: step.item.videoId,
  }));

describe("listSyncPlaylistIds", () => {
  it("lists each Playlist once in first-seen order", () => {
    expect(
      listSyncPlaylistIds(
        definitionOf([
          { id: "a", dependencies: [{ id: "b" }, { id: "c" }] },
          { id: "d", dependencies: [{ id: "c" }] },
        ]),
      ),
    ).toEqual(["a", "b", "c", "d"]);
  });
});

describe("planSyncAddPlaylistItems", () => {
  it("propagates Videos through nested Dependencies", () => {
    const definition = definitionOf([
      { id: "A", dependencies: [{ id: "B", dependencies: [{ id: "C" }] }] },
    ]);
    const entries = { A: [], B: [], C: ["X"] };

    const plan = planSyncAddPlaylistItems({
      definition,
      playlistVideoIds: videoIdsOf(entries),
    });

    expect(plan).toEqual([
      { playlistId: "B", videoId: "X" },
      { playlistId: "A", videoId: "X" },
    ]);
    expect(plan).toEqual(planWithLegacyItems(definition, entries));
  });

  it("skips Videos the target already contains", () => {
    const definition = definitionOf([
      { id: "target", dependencies: [{ id: "source" }] },
    ]);
    const entries = { source: ["X", "Y"], target: ["X"] };

    const plan = planSyncAddPlaylistItems({
      definition,
      playlistVideoIds: videoIdsOf(entries),
    });

    expect(plan).toEqual([{ playlistId: "target", videoId: "Y" }]);
    expect(plan).toEqual(planWithLegacyItems(definition, entries));
  });

  it("keeps duplicate additions planned from multiple Dependencies", () => {
    const definition = definitionOf([
      { id: "target", dependencies: [{ id: "s1" }, { id: "s2" }] },
    ]);
    const entries = { s1: ["X"], s2: ["X"], target: [] };

    const plan = planSyncAddPlaylistItems({
      definition,
      playlistVideoIds: videoIdsOf(entries),
    });

    expect(plan).toEqual([
      { playlistId: "target", videoId: "X" },
      { playlistId: "target", videoId: "X" },
    ]);
    expect(plan).toEqual(planWithLegacyItems(definition, entries));
  });

  it("plans more additions than the legacy quota estimate allowed", () => {
    const videoIds = Array.from({ length: 250 }, (_, index) => `v${index}`);
    const plan = planSyncAddPlaylistItems({
      definition: definitionOf([
        { id: "target", dependencies: [{ id: "source" }] },
      ]),
      playlistVideoIds: videoIdsOf({ source: videoIds, target: [] }),
    });

    expect(plan).toHaveLength(250);
  });

  it("plans nothing when every target is already in sync", () => {
    expect(
      planSyncAddPlaylistItems({
        definition: definitionOf([
          { id: "target", dependencies: [{ id: "source" }] },
        ]),
        playlistVideoIds: videoIdsOf({ source: ["X"], target: ["X"] }),
      }),
    ).toEqual([]);
  });
});
