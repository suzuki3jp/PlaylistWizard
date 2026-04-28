import Image, { type ImageProps } from "next/image";
import { urls } from "@/constants";
import type { Thumbnail } from "@/entities/thumbnail";

type ThumbnailImageProps = Omit<ImageProps, "src"> & {
  thumbnails: Thumbnail[];
  targetWidth: number;
};

export function ThumbnailImage({
  thumbnails,
  targetWidth,
  alt,
  ...props
}: ThumbnailImageProps) {
  const src = selectThumbnailUrl(thumbnails, targetWidth);
  const resolvedSrc = resolveThumbnailUrl(src);
  return <Image src={resolvedSrc} alt={alt} {...props} />;
}

function selectThumbnailUrl(
  thumbnails: Thumbnail[],
  targetWidth: number,
): string | undefined {
  if (thumbnails.length === 0) return undefined;
  return thumbnails.reduce((prev, curr) =>
    Math.abs(curr.width - targetWidth) < Math.abs(prev.width - targetWidth)
      ? curr
      : prev,
  ).url;
}

function resolveThumbnailUrl(src: string | undefined): string {
  if (!src) return "/assets/ogp.png";
  if (src === urls.youtubeApiNoThumbnail())
    return urls.youtubeNoThumbnailProxy();
  return src;
}
