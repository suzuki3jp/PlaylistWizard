import { GITHUB_REPO } from "@/constants";

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class SpotifySpecifierValidator {
  public static readonly IdRegex = /^[0-9a-zA-Z]{22}$/;
  public static readonly UrlRegex =
    /^(?:https?:\/\/)?(?:open\.)?spotify\.com\/playlist\/[a-zA-Z0-9]{22}(?:\?.*)?$/;

  static unique(data: string): string {
    if (SpotifySpecifierValidator.IdRegex.test(data)) {
      return data;
    }
    if (SpotifySpecifierValidator.UrlRegex.test(data)) {
      const match = data.match(/spotify\.com\/playlist\/([a-zA-Z0-9]{22})/);
      if (match) {
        return match[1];
      }
    }

    throw new Error(
      `Invalid Spotify specifier. this is a bug. please report it on GitHub Issues. ${GITHUB_REPO}/isses/new`,
    );
  }

  static isValid(data: string): boolean {
    return (
      SpotifySpecifierValidator.IdRegex.test(data) ||
      SpotifySpecifierValidator.UrlRegex.test(data)
    );
  }
}
