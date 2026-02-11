import { z } from "zod";
import { SpotifyImage } from "./image";

export const SpotifyUser = z.object({
  id: z.string(),
  display_name: z.string().nullable(),
  external_urls: z.object({
    spotify: z.string().url(),
  }),
  images: z.array(SpotifyImage).optional(),
});

export type SpotifyUser = z.infer<typeof SpotifyUser>;
