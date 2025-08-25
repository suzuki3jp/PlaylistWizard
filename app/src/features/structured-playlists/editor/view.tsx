import { CenteredLayout } from "@/lib/components/layouts";
import type { PageProps } from "@/lib/types/next";
import { useServerT } from "@/presentation/hooks/t/server";
import { StructuredPlaylistEditor } from "./components/editor";

export async function StructuredPlaylistEditorView({ params }: PageProps) {
  const { lang } = await params;
  const { t } = await useServerT(lang, "structured-playlists");

  return (
    <main>
      <CenteredLayout direction="x" className="min-h-screen">
        <div className="container flex flex-col space-y-6 px-4 py-8">
          <div className="flex flex-col space-y-2">
            <h1 className="font-bold text-3xl text-white">
              {t("editor.title")}
            </h1>
            <p className="text-gray-400">{t("editor.description")}</p>
          </div>
          <StructuredPlaylistEditor lang={lang} />
        </div>
      </CenteredLayout>
    </main>
  );
}
