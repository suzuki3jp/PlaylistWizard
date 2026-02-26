import type { PropsWithChildren } from "react";
import {
  getPinnedPlaylistIds,
  getProviderAccountIds,
} from "@/features/pinned-playlists/actions";
import { PinnedPlaylistsProvider } from "@/features/pinned-playlists/provider";
import { useServerT } from "@/presentation/hooks/t/server";
import { PlaylistActions } from "./components/playlist-actions";
import { Playlists } from "./components/playlists";
import { TasksMonitor } from "./components/tasks-monitor";
import { HistoryProvider } from "./contexts/history";
import { SearchQueryContextProvider } from "./contexts/search";
import { SelectedPlaylistsContextProvider } from "./contexts/selected-playlists";
import { TaskProvider } from "./contexts/tasks";

interface PlaylistsViewProps {
  lang: string;
}

export async function PlaylistsView({ lang }: PlaylistsViewProps) {
  const [initialPinnedIds, accountIds] = await Promise.all([
    getPinnedPlaylistIds(),
    getProviderAccountIds(),
  ]);
  return (
    <PlaylistsViewLayout lang={lang}>
      <PinnedPlaylistsProvider
        initialIds={initialPinnedIds}
        accountIds={accountIds}
      >
        <SelectedPlaylistsContextProvider>
          <TaskProvider>
            <HistoryProvider>
              <SearchQueryContextProvider>
                <TasksMonitor lang={lang} />
                <PlaylistActions lang={lang} />
                <Playlists />
              </SearchQueryContextProvider>
            </HistoryProvider>
          </TaskProvider>
        </SelectedPlaylistsContextProvider>
      </PinnedPlaylistsProvider>
    </PlaylistsViewLayout>
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
