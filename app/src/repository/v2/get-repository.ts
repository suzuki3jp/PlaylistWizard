import { Provider } from "@/entities/provider";
import { unreachable } from "@/lib/unreachable";
import type { Repository } from ".";
import { SpotifyRepository } from "./spotify/repository";
import { YouTubeRepository } from "./youtube/repository";

export function getRepository(type: Provider, accessToken: string): Repository {
  return type === Provider.GOOGLE
    ? new YouTubeRepository(accessToken)
    : type === Provider.SPOTIFY
      ? new SpotifyRepository(accessToken)
      : unreachable(type);
}
