import type { AdapterPlaylistItem } from "./PlaylistItem";

export class AdapterPlaylist {
    public id: string;
    public title: string;
    public thumbnailUrl: string;
    public itemsTotal: number;

    constructor({
        id,
        title,
        thumbnailUrl,
        itemsTotal,
    }: Omit<AdapterFullPlaylistData, "items">) {
        this.id = id;
        this.title = title;
        this.thumbnailUrl = thumbnailUrl;
        this.itemsTotal = itemsTotal;
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
    items: AdapterPlaylistItem[];
}

export type AdapterPlaylistPrivacy = "public" | "private" | "unlisted";
