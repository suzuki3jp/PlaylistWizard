import { Skeleton } from "@playlistwizard/ui";
import { RouteLoading } from "@/components/route-loading";
import { PlaylistSkeletonCard } from "@/features/playlist/components/playlist-card";

const ACTION_SKELETON_COUNT = 8;
const PLAYLIST_SKELETON_COUNT = 12;

/**
 * Route fallback for the Playlists page, shown while the page waits for
 * server reads such as pinned playlist IDs. Mirrors the layout of
 * `PlaylistsView` so the page footprint does not shift once it resolves.
 */
export default function PlaylistsLoading() {
  return (
    <RouteLoading>
      <main className="flex items-center justify-center">
        <div className="container flex min-h-screen flex-col space-y-6 px-4 py-8">
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>

          <div className="flex flex-col space-y-6">
            <Skeleton className="h-9 w-64 max-w-full" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: ACTION_SKELETON_COUNT }).map((_, i) => (
                // Skeleton items are temporary and have no stable identity.
                <Skeleton key={i} className="h-8 w-24" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: PLAYLIST_SKELETON_COUNT }).map((_, i) => (
                // Skeleton items are temporary and have no stable identity.
                <PlaylistSkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </RouteLoading>
  );
}
