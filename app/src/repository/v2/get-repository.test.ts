import { describe, expect, it } from "vitest";
import { Provider } from "@/entities/provider";
import { getRepository } from "./get-repository";
import { SpotifyRepository } from "./spotify/repository";
import { YouTubeRepository } from "./youtube/repository";

describe("getRepository", () => {
  it("should return YouTubeRepository for Provider.GOOGLE", () => {
    const repo = getRepository(Provider.GOOGLE, "test-token");
    expect(repo).toBeInstanceOf(YouTubeRepository);
  });

  it("should return SpotifyRepository for Provider.SPOTIFY", () => {
    const repo = getRepository(Provider.SPOTIFY, "test-token");
    expect(repo).toBeInstanceOf(SpotifyRepository);
  });
});
