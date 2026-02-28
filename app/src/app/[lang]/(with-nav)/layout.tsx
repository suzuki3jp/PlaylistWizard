import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { AccountsHydrator } from "@/features/accounts";
import { getLinkedAccounts } from "@/features/accounts/actions/get-linked-accounts";
import { getAllStructuredPlaylistsDefinitions } from "@/features/structured-playlists-definition/actions";
import { StructuredPlaylistsDefinitionProvider } from "@/features/structured-playlists-definition/context";
import type { UserProviderProfile } from "@/lib/user";
import { NavigationLayout } from "@/presentation/pages/layouts/navigation";

export default async function ({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  let definitions: Awaited<
    ReturnType<typeof getAllStructuredPlaylistsDefinitions>
  > = {};
  try {
    definitions = await getAllStructuredPlaylistsDefinitions();
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: necessary
    console.error("Failed to load structured playlists definitions:", error);
  }

  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.accounts(),
      queryFn: getLinkedAccounts,
    });
  } catch {
    // non-critical
  }

  const accounts =
    queryClient.getQueryData<UserProviderProfile[]>(queryKeys.accounts()) ?? [];

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NavigationLayout lang={lang}>
        <AccountsHydrator accounts={accounts} />
        <StructuredPlaylistsDefinitionProvider initialData={definitions}>
          {children}
        </StructuredPlaylistsDefinitionProvider>
      </NavigationLayout>
    </HydrationBoundary>
  );
}
