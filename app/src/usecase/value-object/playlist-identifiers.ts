import { urls } from "@/constants";

export class YouTubePlaylistIdentifier {
  private static readonly IdRegex = /^PL[a-zA-Z0-9_-]{32}$/;
  private static readonly UrlRegex =
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:playlist\?list=|watch\?.*?&list=)[a-zA-Z0-9_-]+(?:&.*)?$/;

  constructor(private readonly value: string) {}

  public id(): string {
    if (YouTubePlaylistIdentifier.IdRegex.test(this.value)) {
      return this.value;
    }
    if (YouTubePlaylistIdentifier.UrlRegex.test(this.value)) {
      const url = new URL(this.value);
      const id = url.searchParams.get("list");
      if (id) return id;
    }

    throw new Error(
      `Invalid YouTube specifier. This is a bug. please report it on GitHub Issues. ${urls.GITHUB_REPO}/issues/new`,
    );
  }

  public static from(value: string): YouTubePlaylistIdentifier | null {
    if (YouTubePlaylistIdentifier.isValid(value)) {
      return new YouTubePlaylistIdentifier(value);
    }
    return null;
  }

  public static isValid(value: string): boolean {
    return (
      YouTubePlaylistIdentifier.IdRegex.test(value) ||
      YouTubePlaylistIdentifier.UrlRegex.test(value)
    );
  }
}

export class SpotifyPlaylistIdentifier {
  public static readonly IdRegex = /^[0-9a-zA-Z]{22}$/;
  public static readonly UrlRegex =
    /^(?:https?:\/\/)?(?:open\.)?spotify\.com\/playlist\/[a-zA-Z0-9]{22}(?:\?.*)?$/;

  constructor(private readonly value: string) {}

  public id(): string {
    if (SpotifyPlaylistIdentifier.IdRegex.test(this.value)) {
      return this.value;
    }
    if (SpotifyPlaylistIdentifier.UrlRegex.test(this.value)) {
      const match = this.value.match(
        /spotify\.com\/playlist\/([a-zA-Z0-9]{22})/,
      );
      if (match) {
        return match[1];
      }
    }

    throw new Error(
      `Invalid Spotify specifier. this is a bug. please report it on GitHub Issues. ${urls.GITHUB_REPO}/issues/new`,
    );
  }

  public static from(data: string): SpotifyPlaylistIdentifier | null {
    if (SpotifyPlaylistIdentifier.isValid(data)) {
      return new SpotifyPlaylistIdentifier(data);
    }
    return null;
  }

  static isValid(data: string): boolean {
    return (
      SpotifyPlaylistIdentifier.IdRegex.test(data) ||
      SpotifyPlaylistIdentifier.UrlRegex.test(data)
    );
  }
}
