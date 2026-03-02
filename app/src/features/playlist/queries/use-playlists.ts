"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import type { AccountId } from "@/entities/ids";
import { Provider } from "@/entities/provider";
import { useFocusedAccount } from "@/features/accounts";
import { queryClient } from "@/presentation/providers";
import { isOk } from "@/usecase/actions/plain-result";
import { useSelectedPlaylists } from "../contexts/selected-playlists";
import { getMinePlaylists } from "../get-mine-playlists";

export function usePlaylistsQuery(overrideAccountId?: AccountId) {
  const [focusedAccount] = useFocusedAccount();
  const accId = overrideAccountId ?? focusedAccount?.id;

  const query = useQuery({
    queryKey: queryKeys.playlists(accId),
    // biome-ignore lint/style/noNonNullAssertion: accId is defined when enabled is true
    queryFn: () => getMinePlaylists(Provider.GOOGLE, accId!),
    enabled: !!accId,
    select: (result) => {
      if (isOk(result)) {
        return result.data;
      }

      if (result.status === 404) return [];

      throw new Error("Failed to fetch playlists");
    },
  });

  if (query.isError) throw query.error;

  return query;
}

export function useInvalidatePlaylistsQuery() {
  const { setSelectedPlaylists } = useSelectedPlaylists();
  const [focusedAccount] = useFocusedAccount();
  return async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.playlists(focusedAccount?.id),
    });
    setSelectedPlaylists([]);
  };
}
