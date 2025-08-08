import type { SSRProps } from "@/lib/types/next";
import { PlaylistsPage } from "@/presentation/pages/playlists";

interface PlaylistsProps extends SSRProps {}

export default async function ({ params }: PlaylistsProps) {
  const { lang } = await params;

  return <PlaylistsPage lang={lang} />;
}
