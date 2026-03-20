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
