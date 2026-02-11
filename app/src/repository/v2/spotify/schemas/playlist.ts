import { z } from "zod";
import { SpotifyImage } from "./image";
import { SpotifyPlaylistTrack } from "./track";
import { SpotifyUser } from "./user";

export const SpotifyPlaylistTracksRef = z.object({
  href: z.string().url(),
  total: z.number().int().nonnegative(),
});

export const SpotifyPlaylist = z.object({
  id: z.string(),
  name: z.string(),
  images: z.array(SpotifyImage).nullable(),
  owner: SpotifyUser,
  tracks: SpotifyPlaylistTracksRef,
  external_urls: z.object({
    spotify: z.string().url(),
  }),
  public: z.boolean().nullable(),
});

export const SpotifyFullPlaylist = z.object({
  id: z.string(),
  name: z.string(),
  images: z.array(SpotifyImage).nullable(),
  owner: SpotifyUser,
  tracks: z.object({
    href: z.string().url(),
    total: z.number().int().nonnegative(),
    items: z.array(SpotifyPlaylistTrack),
    next: z.string().url().nullable(),
    previous: z.string().url().nullable(),
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
  }),
  external_urls: z.object({
    spotify: z.string().url(),
  }),
  public: z.boolean().nullable(),
});

export type SpotifyPlaylist = z.infer<typeof SpotifyPlaylist>;
export type SpotifyFullPlaylist = z.infer<typeof SpotifyFullPlaylist>;
