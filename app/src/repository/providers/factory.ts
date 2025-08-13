import type { ProviderRepositoryInterface } from "@/usecase/interface/provider";
import type { ProviderRepositoryType } from "@playlistwizard/core";
import { SpotifyProviderRepository } from "./spotify";
import { YoutubeProviderRepository } from "./youtube";

export function createProviderRepository(
  type: ProviderRepositoryType,
): ProviderRepositoryInterface {
  switch (type) {
    case "google":
      return new YoutubeProviderRepository();
    case "spotify":
      return new SpotifyProviderRepository();
    default:
      throw new Error(`Provider type "${type}" is not implemented.`);
  }
}

// Re-export the type from core for backwards compatibility
export type { ProviderRepositoryType } from "@playlistwizard/core";
