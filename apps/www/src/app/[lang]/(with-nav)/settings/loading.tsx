import { Skeleton } from "@playlistwizard/ui";
import { RouteLoading } from "@/components/route-loading";

/**
 * Route fallback for the settings page, shown while the page reads the
 * session and linked account profiles on the server. Mirrors the layout of
 * `SettingsView` so the page footprint does not shift once it resolves.
 */
export default function SettingsLoading() {
  return (
    <RouteLoading>
      <main className="min-h-screen">
        <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
          <header className="space-y-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </header>
          <section className="space-y-4 rounded-lg border border-gray-800 bg-gray-950/60 p-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96 max-w-full" />
              <Skeleton className="h-3 w-72 max-w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </section>
          <section className="space-y-4 rounded-lg border border-red-900/40 bg-gray-950/60 p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-96 max-w-full" />
            <Skeleton className="h-9 w-40" />
          </section>
        </div>
      </main>
    </RouteLoading>
  );
}
