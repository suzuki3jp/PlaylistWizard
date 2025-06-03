import { it } from "node:test";
import {
  PlaylistItem,
  type PrimitivePlaylistItemInterface,
} from "./playlist-item";

export interface PrimitivePlaylistInterface {
  id: string;
  title: string;
  thumbnailUrl: string;
  itemsTotal: number;
  url: string;
}

export interface PlaylistInterface extends PrimitivePlaylistInterface {
  toJSON(): PrimitivePlaylistInterface;
}

export class Playlist implements PlaylistInterface {
  public id: string;
  public title: string;
  public thumbnailUrl: string;
  public itemsTotal: number;
  public url: string;

  constructor({
    id,
    title,
    thumbnailUrl,
    itemsTotal,
    url,
  }: PrimitivePlaylistInterface) {
    this.id = id;
    this.title = title;
    this.thumbnailUrl = thumbnailUrl;
    this.itemsTotal = itemsTotal;
    this.url = url;
  }

  toJSON(): PrimitivePlaylistInterface {
    return {
      id: this.id,
      title: this.title,
      thumbnailUrl: this.thumbnailUrl,
      itemsTotal: this.itemsTotal,
      url: this.url,
    };
  }
}

export interface PrimitiveFullPlaylistInterface
  extends PrimitivePlaylistInterface {
  items: PrimitivePlaylistItemInterface[];
}

export interface FullPlaylistInterface extends PrimitiveFullPlaylistInterface {
  toJSON(): PrimitiveFullPlaylistInterface;
}

export class FullPlaylist extends Playlist implements FullPlaylistInterface {
  public items: PrimitivePlaylistItemInterface[];

  constructor(data: PrimitiveFullPlaylistInterface) {
    super(data);
    this.items = data.items;
  }

  toJSON(): PrimitiveFullPlaylistInterface {
    return {
      ...super.toJSON(),
      items: this.items.map((item) => {
        if (item instanceof PlaylistItem) {
          return item.toJSON();
        }
        return item;
      }),
    };
  }
}

export type PlaylistPrivacy = "public" | "private" | "unlisted";
