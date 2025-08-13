/**
 * Provider repository types for music services
 */
export type ProviderRepositoryType = "google" | "spotify";

/**
 * Interface for structured playlist definitions
 */
export interface StructuredPlaylistDefinitionInterface {
  /**
   * The version of the definition file format. Currently only 1 is supported.
   */
  version: 1;

  /**
   * The name of the structured playlist definition.
   */
  name: string;

  /**
   * The music service provider. Supported values are "google" or "spotify".
   */
  provider: ProviderRepositoryType;

  /**
   * The unique identifier of the user associated with the playlists.
   */
  user_id: string;

  /**
   * An array of playlist dependencies included in this definition.
   */
  playlists: StructuredPlaylistInterface[];
}

/**
 * Interface for individual structured playlists
 */
export interface StructuredPlaylistInterface {
  /**
   * The unique identifier of the playlist.
   */
  id: string;

  /**
   * An array of dependencies for this playlist.
   * Each dependency can be another structured playlist.
   */
  dependencies?: StructuredPlaylistInterface[];
}
