"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, urls } from "@/constants";
import { UnauthorizedError } from "@/features/error";
import { useNonNullAuth } from "@/presentation/hooks/useAuth";
import { queryClient } from "@/presentation/providers";
import { isOk } from "@/usecase/actions/plain-result";
import { getMinePlaylists } from "../get-mine-playlists";

export function usePlaylistsQuery() {
  const auth = useNonNullAuth();

  const query = useQuery({
    queryKey: queryKeys.playlists(),
    queryFn: () => getMinePlaylists(auth.accessToken, auth.provider),
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
  return () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.playlists(),
    });
}
