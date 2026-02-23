import { getStructuredPlaylistsDefinition } from "@/features/structured-playlists-definition/actions";
import { StructuredPlaylistsDefinitionProvider } from "@/features/structured-playlists-definition/context";
import { NavigationLayout } from "@/presentation/pages/layouts/navigation";

export default async function ({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  let definition: Awaited<ReturnType<typeof getStructuredPlaylistsDefinition>> =
    null;
  try {
    definition = await getStructuredPlaylistsDefinition();
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: necessary
    console.error("Failed to load structured playlists definition:", error);
  }

  return (
    <NavigationLayout lang={lang}>
      <StructuredPlaylistsDefinitionProvider initialData={definition}>
        {children}
      </StructuredPlaylistsDefinitionProvider>
    </NavigationLayout>
  );
}
