import { describe, expect, it } from "vitest";
import { toAccountId } from "@/entities/ids";
import { Provider } from "@/entities/provider";
import { getRepository } from "./get-repository";
import { YouTubeRepository } from "./youtube/repository";

describe("getRepository", () => {
  it("should return YouTubeRepository for Provider.GOOGLE", () => {
    const repo = getRepository(
      Provider.GOOGLE,
      "test-token",
      toAccountId("acc-id"),
    );
    expect(repo).toBeInstanceOf(YouTubeRepository);
  });
});
