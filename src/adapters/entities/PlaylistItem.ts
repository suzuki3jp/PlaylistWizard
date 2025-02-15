export class AdapterPlaylistItem {
    /**
     * Youtube API だとこれはプレイリストアイテムとしての id。 videoId と同じではない
     */
    public id: string;
    public title: string;
    public thumbnailUrl: string;
    public position: number;
    public author: string;
    public videoId: string;

    constructor({
        id,
        title,
        thumbnailUrl,
        position,
        author,
        videoId,
    }: AdapterPlaylistItemData) {
        this.id = id;
        this.title = title;
        this.thumbnailUrl = thumbnailUrl;
        this.position = position;
        this.author = author;
        this.videoId = videoId;
    }
}

export interface AdapterPlaylistItemData {
    id: string;
    title: string;
    thumbnailUrl: string;
    position: number;
    author: string;
    videoId: string;
}
