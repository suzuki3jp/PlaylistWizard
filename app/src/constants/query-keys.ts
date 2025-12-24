type QueryKeyFactory = (...args: unknown[]) => readonly string[];

export const playlists: QueryKeyFactory = () => ["playlists"];
