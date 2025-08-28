import { type IImages, Image, Images, type RawImage } from "./Image";

export class Playlist implements IPlaylist {
  public id: string;
  public name: string;
  public images: IImages | null;
  public tracksTotal: number;
  public url: string;

  constructor(private data: RawPlaylist) {
    this.id = data.id;
    this.name = data.name;
    this.images = data.images
      ? new Images(data.images.map((img) => new Image(img)))
      : null;
    this.tracksTotal = data.tracks.total;
    this.url = data.external_urls.spotify;
  }

  public getRaw(): RawPlaylist {
    return this.data;
  }
}

export type IPlaylist = {
  id: string;
  name: string;
  images: IImages | null;
  tracksTotal: number;
  url: string;

  /**
   * We define only the properties that PlaylistWizard uses.
   * If you need more properties, you can use this method to get raw data.
   * @returns
   */
  getRaw: () => RawPlaylist;
};

export interface RawPlaylist {
  collaborative: boolean;
  description: string;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: RawImage[] | null;
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
