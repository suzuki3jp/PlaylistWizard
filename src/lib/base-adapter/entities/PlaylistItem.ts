export class PlaylistItem {
    /**
     * Youtube API だとこれはプレイリストアイテムとしての id。 videoId と同じではない
     */
    private id: string;
    private title: string;
    private thumbnailUrl: string;
    private position: number;
    private author: string;
    private videoId: string;

    constructor(data: PlaylistItemData) {
        const { id, title, thumbnailUrl, position, author, videoId } = data;
        this.id = id;
        this.title = title;
        this.thumbnailUrl = thumbnailUrl;
        this.position = position;
        this.author = author;
        this.videoId = videoId;
    }

    get getId(): string {
        return this.id;
    }

    get getTitle(): string {
        return this.title;
    }

    get getThumbnailUrl(): string {
        return this.thumbnailUrl;
    }

    get getPosition(): number {
        return this.position;
    }

    get getAuthor(): string {
        return this.author;
    }

    get getVideoId(): string {
        return this.videoId;
    }
}

interface PlaylistItemData {
    id: string;
    title: string;
    thumbnailUrl: string;
    position: number;
    author: string;
    videoId: string;
}
