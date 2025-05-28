import { REST } from "./REST";
import { PlaylistManager } from "./managers/PlaylistManager";

export class ApiClient extends REST {
  public playlist: PlaylistManager;

  constructor({ accessToken }: ApiClientOptions) {
    super(accessToken);
    this.playlist = new PlaylistManager(this);
  }
}

export interface ApiClientOptions {
  accessToken: string;
}
