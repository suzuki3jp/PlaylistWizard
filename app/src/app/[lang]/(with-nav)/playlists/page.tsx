import { PlaylistsPage } from "@/presentation/pages/playlists";

export default async function ({ params }: PageProps<"/[lang]/playlists">) {
  const { lang } = await params;

  return <PlaylistsPage lang={lang} />;
}
