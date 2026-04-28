export const YOUTUBE_NO_THUMBNAIL_SUFFIX = "/no_thumbnail.jpg";
export const YOUTUBE_DEFAULT_THUMBNAIL =
  "https://i.ytimg.com/img/no_thumbnail.jpg";

export const YOUTUBE_THUMBNAIL_DEFAULTS: Record<
  string,
  { width: number; height: number }
> = {
  default: { width: 120, height: 90 },
  medium: { width: 320, height: 180 },
  high: { width: 480, height: 360 },
  standard: { width: 640, height: 480 },
  maxres: { width: 1280, height: 720 },
};

export const YOUTUBE_THUMBNAIL_QUALITY_KEYS = [
  "maxres",
  "standard",
  "high",
  "medium",
  "default",
] as const;
