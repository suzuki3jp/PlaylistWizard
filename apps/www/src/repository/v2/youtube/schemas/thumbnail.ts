import { z } from "zod";

export const YouTubeThumbnail = z.object({
  url: z.url(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type YouTubeThumbnail = z.infer<typeof YouTubeThumbnail>;

export const YouTubeThumbnails = z.object({
  default: YouTubeThumbnail.optional(),
  medium: YouTubeThumbnail.optional(),
  high: YouTubeThumbnail.optional(),
  standard: YouTubeThumbnail.optional(),
  maxres: YouTubeThumbnail.optional(),
});
