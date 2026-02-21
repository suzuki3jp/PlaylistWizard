"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, urls } from "@/constants";
import { Provider } from "@/entities/provider";
import { UnauthorizedError } from "@/features/error";
import { queryClient } from "@/presentation/providers";
import { isOk } from "@/usecase/actions/plain-result";
import { useSelectedPlaylists } from "../contexts/selected-playlists";
import { getMinePlaylists } from "../get-mine-playlists";

export function usePlaylistsQuery() {
  const query = useQuery({
    queryKey: queryKeys.playlists(),
    queryFn: () => getMinePlaylists(Provider.GOOGLE),
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
  return async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.playlists(),
    });
    setSelectedPlaylists([]);
  };
}
