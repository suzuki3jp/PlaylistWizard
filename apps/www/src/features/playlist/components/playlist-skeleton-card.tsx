import { Skeleton } from "@playlistwizard/ui";

/**
 * Placeholder with the footprint of a `PlaylistCard`.
 *
 * Kept free of client-only dependencies so that server-rendered route
 * fallbacks can use it without pulling the playlist card's client bundle.
 */
export function PlaylistSkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-800/50">
      <div className="relative aspect-video rounded-t-lg">
        <Skeleton className="absolute inset-0" />
        <div className="absolute top-2 right-2">
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
