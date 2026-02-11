import Image, { type ImageProps } from "next/image";
import { urls } from "@/constants";

type ThumbnailImageProps = Omit<ImageProps, "src"> & {
  src: string | undefined;
};

export function ThumbnailImage({ src, alt, ...props }: ThumbnailImageProps) {
  const resolvedSrc = resolveThumbnailUrl(src);
  return <Image src={resolvedSrc} alt={alt} {...props} />;
}

function resolveThumbnailUrl(src: string | undefined): string {
  if (!src) return "/assets/ogp.png";
  if (src === urls.youtubeApiNoThumbnail())
    return urls.youtubeNoThumbnailProxy();
  return src;
}
