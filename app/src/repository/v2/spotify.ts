import type { Repository } from ".";

export class SpotifyRepository implements Repository {
  constructor(private accessToken: string) {}

  async getMyPlaylists() {
    return [];
  }
}
