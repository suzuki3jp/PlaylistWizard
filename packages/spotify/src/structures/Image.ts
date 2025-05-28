export class Images implements IImages {
  constructor(private images: IImage[]) {}

  public getLargest(): Image | null {
    if (this.images.length === 0) return null;

    const sortedImages = this.getSortedImages();
    const largestImage = sortedImages[0];

    return largestImage;
  }

  public getSmallest(): Image | null {
    if (this.images.length === 0) return null;

    const sortedImages = this.getSortedImages();
    const smallestImage = sortedImages[sortedImages.length - 1];

    return smallestImage;
  }

  public getAll(): Image[] {
    return this.getSortedImages();
  }

  private getSortedImages(): Image[] {
    // Sort images by size in descending order
    return this.images.sort((a, b) => (b.getSize() ?? 0) - (a.getSize() ?? 0));
  }
}

export interface IImages {
  getLargest: () => Image | null;
  getSmallest: () => Image | null;
  getAll: () => Image[];
}

export class Image implements IImage {
  public url: string;
  public height: number | null;
  public width: number | null;

  constructor(data: RawImage) {
    this.url = data.url;
    this.height = data.height;
    this.width = data.width;
  }

  /**
   * Returns the size of the image.
   * Note: This method used to sort images by size in Images class.
   */
  public getSize(): number | null {
    if (this.height && this.width) {
      return this.height * this.width;
    }
    return null;
  }
}

export type IImage = { getSize: () => number | null } & RawImage;

export interface RawImage {
  url: string;
  height: number | null;
  width: number | null;
}
