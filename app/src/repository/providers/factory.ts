import { Provider } from "@/entities/provider";
import type { ProviderRepositoryInterface } from "@/usecase/interface/provider";
import { SpotifyProviderRepository } from "./spotify";
import { YoutubeProviderRepository } from "./youtube";

export function createProviderRepository(
  type: ProviderRepositoryType,
): ProviderRepositoryInterface {
  switch (type) {
    case Provider.GOOGLE:
      return new YoutubeProviderRepository();
    case Provider.SPOTIFY:
      return new SpotifyProviderRepository();
    default:
      throw new Error(`Provider type "${type}" is not implemented.`);
  }
}

export type ProviderRepositoryType = Provider;
