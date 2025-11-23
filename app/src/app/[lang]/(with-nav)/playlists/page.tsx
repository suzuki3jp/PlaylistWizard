import { PlaylistsView } from "@/features/playlist/view";

export default async function ({ params }: PageProps<"/[lang]/playlists">) {
  const { lang } = await params;

  return <PlaylistsView lang={lang} />;
}
