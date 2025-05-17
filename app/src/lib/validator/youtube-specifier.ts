import { GITHUB_REPO } from "@/constants";

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class YouTubePlaylistSpecifierValidator {
  private static readonly IdRegex = /^PL[a-zA-Z0-9_-]{32}$/;
  private static readonly UrlRegex =
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:playlist\?list=|watch\?.*?&list=)[a-zA-Z0-9_-]+(?:&.*)?$/;

  static unique(data: string): string {
    if (YouTubePlaylistSpecifierValidator.IdRegex.test(data)) {
      return data;
    }
    if (YouTubePlaylistSpecifierValidator.UrlRegex.test(data)) {
      const url = new URL(data);
      const id = url.searchParams.get("list");
      if (id) return id;
    }

    throw new Error(
      `Invalid YouTube specifier. This is a bug. please report it on GitHub Issues. ${GITHUB_REPO}/issues/new`,
    );
  }

  static isValid(data: string): boolean {
    return (
      YouTubePlaylistSpecifierValidator.IdRegex.test(data) ||
      YouTubePlaylistSpecifierValidator.UrlRegex.test(data)
    );
  }
}
