import { SpotifyApiError } from "./SpotifyApiError";

export type IREST = {
  /**
   * Fetches data from the Spotify API.
   * @param path
   * @param options
   * @param noJson - If false, the response will not be parsed as JSON. (e.g. for DELETE requests)
   * @returns
   */
  fetch: <T>(
    path: string,
    options: FetchOptions,
    noJson?: boolean,
  ) => Promise<T>;
};

export class REST implements IREST {
  constructor(public token: string) {}

  public async fetch<T>(
    path: string,
    { method = "GET", params, body }: FetchOptions,
    noJson = false, // for no json response e.g. DELETE
  ): Promise<T> {
    const url = this.makeUrl(path, params);
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new SpotifyApiError(response.status);
    }
    if (noJson) {
      return response as unknown as T;
    }
    const data = await response.json();
    return data;
  }

  private makeUrl(path: string, params?: Record<string, string>): string {
    let urlPath = path;
    if (params) {
      const query = new URLSearchParams(params).toString();
      urlPath += `?${query}`;
    }
    if (urlPath.startsWith("https")) {
      return urlPath;
    }
    return `https://api.spotify.com/v1${urlPath}`;
  }
}

interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  params?: Record<string, string>;
  body?: Record<string, unknown>;
}
