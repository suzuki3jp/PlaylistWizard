"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, urls } from "@/constants";
import { Provider } from "@/entities/provider";
import { useFocusedAccount } from "@/features/accounts";
import { UnauthorizedError } from "@/features/error";
import { queryClient } from "@/presentation/providers";
import { isOk } from "@/usecase/actions/plain-result";
import { useSelectedPlaylists } from "../contexts/selected-playlists";
import { getMinePlaylists } from "../get-mine-playlists";

export function usePlaylistsQuery(overrideAccId?: string) {
  const [focusedAccount] = useFocusedAccount();
  const accId = overrideAccId ?? focusedAccount?.id;

  const query = useQuery({
    queryKey: queryKeys.playlists(accId),
    queryFn: () => getMinePlaylists(Provider.GOOGLE, accId ?? ""),
    enabled: !!accId,
    select: (result) => {
      if (isOk(result)) {
        return result.data;
      }

      if (result.status === 404) return [];

      throw new UnauthorizedError(
        "Failed to fetch playlists",
        urls.playlists(),
      );
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
