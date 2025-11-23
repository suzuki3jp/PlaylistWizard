import { randomUUID } from "node:crypto";
import { type PropsWithChildren, Suspense } from "react";
import { useServerT } from "@/presentation/hooks/t/server";
import { CookiesProviderClient } from "@/presentation/providers";
import { PlaylistSkeletonCard } from "./components/playlist-card";
import { Playlists } from "./components/playlists";
import { PlaylistsContainer } from "./components/playlists-container";
import { TasksMonitor } from "./components/tasks-monitor";
import { TaskProvider } from "./contexts/tasks";

interface PlaylistsViewProps {
  lang: string;
}

export async function PlaylistsView({ lang }: PlaylistsViewProps) {
  return (
    <PlaylistsViewLayout lang={lang}>
      <Suspense fallback={<PlaylistsLoading />}>
        {/* Suspense 内で Provider がないとなぜかエラーになる */}
        <CookiesProviderClient>
          <PlaylistsContainer lang={lang}>
            <TaskProvider>
              <TasksMonitor lang={lang} />
              <Playlists />
            </TaskProvider>
          </PlaylistsContainer>
        </CookiesProviderClient>
      </Suspense>
    </PlaylistsViewLayout>
  );
}

function PlaylistsLoading() {
  const SKELETON_COUNT = 12;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: SKELETON_COUNT }).map(() => (
        <PlaylistSkeletonCard key={randomUUID()} />
      ))}
    </div>
  );
}

async function PlaylistsViewLayout({
  children,
  lang,
}: PropsWithChildren<PlaylistsViewProps>) {
  const { t } = await useServerT(lang);

  return (
    <main className="flex items-center justify-center">
      <div className="container flex min-h-screen flex-col space-y-6 px-4 py-8">
        <div className="flex flex-col space-y-2">
          <h1 className="font-bold text-3xl text-white">
            {t("playlists.title")}
          </h1>
          <p className="text-gray-400">{t("playlists.description")}</p>
        </div>

        <div className="flex flex-col space-y-6">{children}</div>
      </div>
    </main>
  );
}
