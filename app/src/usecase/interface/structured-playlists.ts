import type { ProviderRepositoryType } from "@/repository/providers/factory";

export type StructuredPlaylistDefinitionInterface = {
  version: number;
  name: string;
  provider: ProviderRepositoryType;
  user_id: string;
  playlists: StructuredPlaylistInterface[];
};

export type StructuredPlaylistInterface = {
  id: string;
  dependencies?: StructuredPlaylistInterface[];
};
