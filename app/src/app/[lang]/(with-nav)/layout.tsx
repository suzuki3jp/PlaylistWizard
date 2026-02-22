import { getStructuredPlaylistsDefinition } from "@/features/structured-playlists-definition/actions";
import { StructuredPlaylistsDefinitionProvider } from "@/features/structured-playlists-definition/context";
import { NavigationLayout } from "@/presentation/pages/layouts/navigation";

export default async function ({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  const definition = await getStructuredPlaylistsDefinition();

  return (
    <NavigationLayout lang={lang}>
      <StructuredPlaylistsDefinitionProvider initialData={definition}>
        {children}
      </StructuredPlaylistsDefinitionProvider>
    </NavigationLayout>
  );
}
