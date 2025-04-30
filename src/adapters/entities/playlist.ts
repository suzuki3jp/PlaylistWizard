import {
    AdapterPlaylistItem,
    type IAdapterPlaylistItem,
} from "./playlist-item";

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
    }: IAdapterPlaylist) {
        this.id = id;
        this.title = title;
        this.thumbnailUrl = thumbnailUrl;
        this.itemsTotal = itemsTotal;
        this.url = url;
    }

    toJSON(): IAdapterPlaylist {
        return {
            id: this.id,
            title: this.title,
            thumbnailUrl: this.thumbnailUrl,
            itemsTotal: this.itemsTotal,
            url: this.url,
        };
    }
}

export class AdapterFullPlaylist extends AdapterPlaylist {
    public items: AdapterPlaylistItem[];

    constructor(data: IAdapterFullPlaylist) {
        super(data);
        this.items = data.items.map((item) => new AdapterPlaylistItem(item));
    }

    toJSON(): IAdapterFullPlaylist {
        return {
            ...super.toJSON(),
            items: this.items,
        };
    }
}

export interface IAdapterFullPlaylist {
    id: string;
    title: string;
    thumbnailUrl: string;
    itemsTotal: number;
    url: string;
    items: IAdapterPlaylistItem[];
}

export type IAdapterPlaylist = Omit<IAdapterFullPlaylist, "items">;

export type AdapterPlaylistPrivacy = "public" | "private" | "unlisted";
