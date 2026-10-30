import { Skeleton } from "@playlistwizard/ui";
import { MaxWidthContainer } from "@/components/max-width-container";
import { RouteLoading } from "@/components/route-loading";

const ROW_SKELETON_COUNT = 8;

/**
 * Route fallback for the playlist browser, shown while the page fetches
 * playlist metadata on the server. Mirrors a single `PlaylistBrowser` panel;
 * the number of selected playlists is not known until the page renders.
 */
export default function PlaylistBrowserLoading() {
  return (
    <RouteLoading>
      <MaxWidthContainer className="min-h-screen">
        <main className="container py-8">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-9 w-56" />
              <Skeleton className="h-5 w-80 max-w-full" />
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900 shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-800 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-6 w-40" />
                </div>
                <div className="w-full max-w-xs">
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="divide-y divide-gray-800">
                {Array.from({ length: ROW_SKELETON_COUNT }).map((_, i) => (
                  <div
                    // Skeleton rows are temporary and have no stable identity.
                    key={i}
                    className="flex items-center gap-4 p-4"
                  >
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </MaxWidthContainer>
    </RouteLoading>
  );
}
