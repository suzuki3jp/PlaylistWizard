export interface PrimitivePlaylistItemInterface {
  id: string;
  title: string;
  thumbnailUrl: string;
  position: number;
  author: string;
  videoId: string;
  url: string;
}

export interface PlaylistItemInterface extends PrimitivePlaylistItemInterface {
  toJSON(): PrimitivePlaylistItemInterface;
}

export class PlaylistItem implements PlaylistItemInterface {
  /**
   * Youtube API だとこれはプレイリストアイテムとしての id。 videoId と同じではない
   */
  public id: string;
  public title: string;
  public thumbnailUrl: string;
  public position: number;
  public author: string;
  public videoId: string;
  public url: string;

  constructor({
    id,
    title,
    thumbnailUrl,
    position,
    author,
    videoId,
    url,
  }: PrimitivePlaylistItemInterface) {
    this.id = id;
    this.title = title;
    this.thumbnailUrl = thumbnailUrl;
    this.position = position;
    this.author = author;
    this.videoId = videoId;
    this.url = url;
  }

  toJSON(): ReturnType<PlaylistItemInterface["toJSON"]> {
    return {
      id: this.id,
      title: this.title,
      thumbnailUrl: this.thumbnailUrl,
      position: this.position,
      author: this.author,
      videoId: this.videoId,
      url: this.url,
    };
  }
}
