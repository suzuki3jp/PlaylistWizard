"use client";

import { PlaylistList } from "./playlist-list";

export function StructuredPlaylistEditor({ lang }: { lang: string }) {
  return (
    <div>
      <PlaylistList lang={lang} />
    </div>
  );
}
