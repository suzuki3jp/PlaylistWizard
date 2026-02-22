import { describe, expect, it } from "vitest";
import { Provider } from "@/entities/provider";
import { getRepository } from "./get-repository";
import { YouTubeRepository } from "./youtube/repository";

describe("getRepository", () => {
  it("should return YouTubeRepository for Provider.GOOGLE", () => {
    const repo = getRepository(Provider.GOOGLE, "test-token");
    expect(repo).toBeInstanceOf(YouTubeRepository);
  });
});
