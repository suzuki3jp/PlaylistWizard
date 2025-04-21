import type { AdapterPlaylistItem } from "./PlaylistItem";

export class AdapterPlaylist {
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
    }: Omit<AdapterFullPlaylistData, "items">) {
        this.id = id;
        this.title = title;
        this.thumbnailUrl = thumbnailUrl;
        this.itemsTotal = itemsTotal;
        this.url = url;
    }
}

export class AdapterFullPlaylist extends AdapterPlaylist {
    public items: AdapterPlaylistItem[];

    constructor(data: AdapterFullPlaylistData) {
        super(data);
        this.items = data.items;
    }
}

export interface AdapterFullPlaylistData {
    id: string;
    title: string;
    thumbnailUrl: string;
    itemsTotal: number;
    url: string;
    items: AdapterPlaylistItem[];
}

export type AdapterPlaylistPrivacy = "public" | "private" | "unlisted";
