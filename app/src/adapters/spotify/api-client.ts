import type { HTTP_METHOD } from "next/dist/server/web/http";

export class SpotifyApiError extends Error {
  constructor(
    public code: number,
    message?: string,
  ) {
    super(message);
    this.name = "SpotifyApiError";
  }
}

export class REST {
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

export class ApiClient extends REST {
  public async updatePlaylistItemPosition(
    playlistId: string,
    rangeStart: number,
    insertBefore: number,
  ) {
    const data = await this.fetch<{ snapshot_id: string }>(
      `/playlists/${playlistId}/tracks`,
      {
        method: "PUT",
        body: {
          range_length: 1,
          range_start: rangeStart,
          insert_before: insertBefore,
        },
      },
    );
    return data;
  }

  public async getMyPlaylists() {
    const data = await this.fetch<IPagination<IPlaylist>>("/me/playlists", {
      method: "GET",
      params: {
        limit: "50",
      },
    });
    const page = new Pagination(data, this.token);
    return await page.all();
  }

  public async getPlaylist(playlistId: string) {
    const data = await this.fetch<IFullPlaylist>(`/playlists/${playlistId}`, {
      method: "GET",
    });
    return data;
  }

  public async addPlaylist(
    id: string,
    name: string,
    privacy: "public" | "private" = "private",
  ) {
    const data = await this.fetch<IPlaylist>(`/users/${id}/playlists`, {
      method: "POST",
      body: {
        name,
        public: privacy,
      },
    });
    return data;
  }

  public async getMe() {
    const data = await this.fetch<IMe>("/me", {
      method: "GET",
    });
    return data;
  }

  public async addPlaylistItem(playlistId: string, resourceId: string) {
    const data = await this.fetch<{ snapshot_id: string }>(
      `/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        params: {
          uris: `spotify:track:${resourceId}`,
        },
      },
    );
    return data;
  }

  public async deletePlaylist(playlistId: string): Promise<void> {
    await this.fetch(
      `/playlists/${playlistId}/followers`,
      {
        method: "DELETE",
      },
      true,
    );
    return;
  }
}

interface FetchOptions {
  method?: HTTP_METHOD;
  params?: Record<string, string>;
  body?: Record<string, unknown>;
}

export class Pagination<T> {
  public items: T[];

  private rest: REST;
  constructor(
    private data: IPagination<T>,
    token: string,
  ) {
    this.items = this.data.items;
    this.rest = new REST(token);
  }

  private async prev() {
    if (!this.data.previous) return null;
    const data = await this.rest.fetch<IPagination<T>>(this.data.previous, {});
    return new Pagination(data, this.rest.token);
  }

  private async next() {
    if (!this.data.next) return null;
    const data = await this.rest.fetch<IPagination<T>>(this.data.next, {});
    return new Pagination(data, this.rest.token);
  }

  public async all() {
    const result = [...this.items];

    let prev = await this.prev();
    while (prev) {
      result.push(...prev.items);
      prev = await prev.prev();
    }

    let next = await this.next();
    while (next) {
      result.push(...next.items);
      next = await next.next();
    }
    return result;
  }
}

export interface IPagination<T> {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: T[];
}

export interface IPlaylist {
  collaborative: boolean;
  description: string;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: IImage[] | null;
  name: string;
  owner: {
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    type: string;
    uri: string;
    display_name: string | null;
  };
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    total: number;
  };
  type: string;
  uri: string;
}

export interface IFullPlaylist extends IPlaylist {
  tracks: IPagination<ITrack>;
}

export interface ITrack {
  track: {
    album: {
      images: IImage[];
    };
    artists: {
      external_urls: { spotify: string };
      href: string;
      id: string;
      name: string;
      type: string;
      uri: string;
    }[];
    external_urls: {
      spotify: string;
    };
    id: string;
    name: string;
    uri: string;
  };
}

export interface IImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface IMe {
  id: string;
}
