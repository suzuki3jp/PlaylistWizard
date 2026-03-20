"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { getLinkedAccounts } from "../actions/get-linked-accounts";

export function useAccountsQuery() {
  return useQuery({
    queryKey: queryKeys.accounts(),
    queryFn: getLinkedAccounts,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useInvalidateAccountsQuery() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
}
