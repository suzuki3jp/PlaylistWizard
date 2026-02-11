import { z } from "zod";

export const SpotifyImage = z.object({
  url: z.string().url(),
  height: z.number().int().positive().nullable(),
  width: z.number().int().positive().nullable(),
});

export type SpotifyImage = z.infer<typeof SpotifyImage>;
