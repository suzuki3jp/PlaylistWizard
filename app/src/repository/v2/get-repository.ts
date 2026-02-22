import { Provider } from "@/entities/provider";
import { unreachable } from "@/lib/unreachable";
import type { Repository } from ".";
import { YouTubeRepository } from "./youtube/repository";

export function getRepository(type: Provider, accessToken: string): Repository {
  return type === Provider.GOOGLE
    ? new YouTubeRepository(accessToken)
    : unreachable(type);
}
