import { Skeleton } from "@playlistwizard/ui";
import { RouteLoading } from "@/components/route-loading";

const RESULT_SKELETON_COUNT = 5;

/**
 * Route fallback for the search page, shown while the page reads pinned
 * playlist IDs on the server. Mirrors the layout of `SearchView` so the page
 * footprint does not shift once it resolves.
 */
export default function SearchLoading() {
  return (
    <RouteLoading>
      <main className="flex justify-center">
        <div className="flex min-h-screen w-full max-w-xl flex-col space-y-6 px-4 py-8">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-9 w-36" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: RESULT_SKELETON_COUNT }).map((_, i) => (
              // Skeleton rows are temporary and have no stable identity.
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    </RouteLoading>
  );
}
