import { describe, expect, it } from "vitest";
import * as urls from "./urls";

describe("playlists", () => {
  it("localizes the path and carries the focused Account", () => {
    expect(urls.playlists("ja", "acc-1")).toBe("/ja/playlists?fa=acc-1");
  });

  it("omits fa when no Account is focused", () => {
    expect(urls.playlists("en")).toBe("/en/playlists");
    expect(urls.playlists("en", null)).toBe("/en/playlists");
  });
});

describe("playlistBrowser", () => {
  it("keeps every selected Playlist ID and the focused Account", () => {
    const url = urls.playlistBrowser("en", ["PL1", "PL2", "PL3"], "acc-1");
    const parsed = new URL(url, "https://example.com");

    expect(parsed.pathname).toBe("/en/playlists/browser");
    expect(parsed.searchParams.get("ids")).toBe("PL1,PL2,PL3");
    expect(parsed.searchParams.get("fa")).toBe("acc-1");
  });

  it("omits fa when no Account is focused", () => {
    const parsed = new URL(
      urls.playlistBrowser("ja", ["PL1"], null),
      "https://example.com",
    );

    expect(parsed.pathname).toBe("/ja/playlists/browser");
    expect(parsed.searchParams.has("fa")).toBe(false);
  });
});

describe("search", () => {
  it("encodes the query text and carries the focused Account", () => {
    const query = "a&b=c 日本語 #?";
    const parsed = new URL(
      urls.search("ja", query, "acc-1"),
      "https://example.com",
    );

    expect(parsed.pathname).toBe("/ja/search");
    expect(parsed.searchParams.get("q")).toBe(query);
    expect(parsed.searchParams.get("fa")).toBe("acc-1");
  });
});

describe("structuredPlaylistsEditor", () => {
  it("carries the focused Account when given", () => {
    expect(urls.structuredPlaylistsEditor("en", "acc-1")).toBe(
      "/en/structured-playlists/editor?fa=acc-1",
    );
    expect(urls.structuredPlaylistsEditor("en")).toBe(
      "/en/structured-playlists/editor",
    );
  });
});

describe("settings", () => {
  it("carries the focused Account when given", () => {
    expect(urls.settings("ja", "acc-1")).toBe("/ja/settings?fa=acc-1");
    expect(urls.settings("ja")).toBe("/ja/settings");
  });
});

describe("signIn", () => {
  it("returns to locale-less paths", () => {
    expect(urls.signIn("en", urls.playlistsPath)).toBe(
      "/en/sign-in?redirect_to=/playlists",
    );
    expect(urls.signIn("ja", urls.structuredPlaylistsEditorPath)).toBe(
      "/ja/sign-in?redirect_to=/structured-playlists/editor",
    );
    expect(urls.signIn("en", urls.settingsPath)).toBe(
      "/en/sign-in?redirect_to=/settings",
    );
    expect(urls.signIn("en", urls.devConsolePath)).toBe(
      "/en/sign-in?redirect_to=/dev/console",
    );
  });
});
