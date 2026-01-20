import type { z } from "zod";

import type { Repository } from "..";

export class YouTubeRepository implements Repository {
  private requiredParts = ["id", "snippet", "contentDetails"]; // for playlists

  constructor(private accessToken: string) {}

  async getMyPlaylists() {
    return this.fetch("/playlists", {
      params: {
        part: this.requiredParts.join(","),
        mine: "true",
      },
    });
  }

  private async fetch<T extends z.ZodAny>(
    path: string,
    responseSchema: T,
    options: FetchOptions = {},
  ): Promise<z.infer<T>> {
    const response = await fetch(this.makeUrl(path, options.params), {
      method: options.method,
      body: options.body,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    return responseSchema.parse(await response.json());
  }

  private makeUrl(path: string, params?: FetchOptions["params"]) {
    return `https://www.googleapis.com/youtube/v3${path}${params ? `?${new URLSearchParams(params).toString()}` : ""}`;
  }
}

interface FetchOptions {
  method?: RequestInit["method"];
  params?: Record<string, string>;
  body?: RequestInit["body"];
}
