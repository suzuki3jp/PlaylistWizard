import { PlaylistManager } from "./managers/PlaylistManager";
import { REST } from "./REST";

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
