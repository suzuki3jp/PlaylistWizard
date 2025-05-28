export class SpotifyApiError extends Error {
  constructor(
    public code: number,
    message?: string,
  ) {
    super(message);
    this.name = "SpotifyApiError";
  }
}
