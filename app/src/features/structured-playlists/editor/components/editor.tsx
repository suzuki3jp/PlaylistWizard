"use client";

import { DependencyTree } from "./dependency-tree";
import { PlaylistList } from "./playlist-list";

export function StructuredPlaylistEditor({ lang }: { lang: string }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <PlaylistList lang={lang} />
      <DependencyTree />
    </div>
  );
}
