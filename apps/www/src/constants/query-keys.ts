type QueryKeyFactory = (...args: unknown[]) => readonly string[];

export const accounts: QueryKeyFactory = () => ["accounts"];

export const playlists = (accId?: string) =>
  accId ? (["playlists", accId] as const) : (["playlists"] as const);
