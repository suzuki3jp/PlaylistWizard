import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { getLinkedAccounts } from "@/features/accounts/actions/get-linked-accounts";
import { getAllStructuredPlaylistsDefinitions } from "@/features/structured-playlists-definition/actions";
import { StructuredPlaylistsDefinitionProvider } from "@/features/structured-playlists-definition/context";
import { NavigationLayout } from "@/presentation/pages/layouts/navigation";

export default async function WithNavLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  const queryClient = new QueryClient();

  const [definitions] = await Promise.all([
    getAllStructuredPlaylistsDefinitions().catch((error) => {
      // biome-ignore lint/suspicious/noConsole: necessary
      console.error("Failed to load structured playlists definitions:", error);
      return {} as Awaited<
        ReturnType<typeof getAllStructuredPlaylistsDefinitions>
      >;
    }),
    queryClient
      .prefetchQuery({
        queryKey: queryKeys.accounts(),
        queryFn: getLinkedAccounts,
      })
      .catch(() => {
        // non-critical
      }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NavigationLayout lang={lang}>
        <StructuredPlaylistsDefinitionProvider initialData={definitions}>
          {children}
        </StructuredPlaylistsDefinitionProvider>
      </NavigationLayout>
    </HydrationBoundary>
  );
}
