import { z } from "zod";
import { SpotifyImage } from "./image";

export const SpotifyArtist = z.object({
  id: z.string(),
  name: z.string(),
  external_urls: z.object({
    spotify: z.string().url(),
  }),
});

export const SpotifyAlbum = z.object({
  id: z.string(),
  name: z.string(),
  images: z.array(SpotifyImage),
  external_urls: z.object({
    spotify: z.string().url(),
  }),
});

export const SpotifyTrack = z.object({
  id: z.string(),
  name: z.string(),
  artists: z.array(SpotifyArtist),
  album: SpotifyAlbum,
  external_urls: z.object({
    spotify: z.string().url(),
  }),
});

export const SpotifyPlaylistTrack = z.object({
  track: SpotifyTrack.nullable(),
  added_at: z.string().nullable(),
});

export type SpotifyArtist = z.infer<typeof SpotifyArtist>;
export type SpotifyAlbum = z.infer<typeof SpotifyAlbum>;
export type SpotifyTrack = z.infer<typeof SpotifyTrack>;
export type SpotifyPlaylistTrack = z.infer<typeof SpotifyPlaylistTrack>;
