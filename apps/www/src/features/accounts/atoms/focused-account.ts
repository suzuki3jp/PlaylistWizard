"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";
import { searchParams } from "@/constants";
import type { UserProviderProfile } from "@/lib/user";
import { useAccountsQuery } from "../queries/use-accounts";

export type FocusedAccount = UserProviderProfile;

/**
 * Returns the focused Account ID as written in the current URL, without
 * resolving it against the linked Accounts.
 * Global navigation uses this to carry the focused Account into links: it is
 * rendered on every page, including signed-out ones, where linked Accounts are
 * not loaded.
 */
export function useFocusedAccountId(): string | null {
  const [accountId] = useQueryState(searchParams.focusedAccount, parseAsString);
  return accountId;
}

export function useFocusedAccount(): [
  FocusedAccount | null,
  (acc: FocusedAccount | null) => void,
] {
  const [accountId, setAccountId] = useQueryState(
    searchParams.focusedAccount,
    parseAsString,
  );
  const { data: accounts } = useAccountsQuery();

  // proxy.ts validates the account param on full navigation,
  // so it's normally always found. The fallback handles
  // temporary inconsistency during client-side navigation.
  const focusedAccount = useMemo(() => {
    if (!accounts || accounts.length === 0) return null;
    if (accountId) {
      return accounts.find((a) => a.id === accountId) ?? accounts[0];
    }
    return accounts[0];
  }, [accountId, accounts]);

  const setFocusedAccount = useCallback(
    (acc: FocusedAccount | null) => {
      setAccountId(acc?.id ?? null);
    },
    [setAccountId],
  );

  return [focusedAccount, setFocusedAccount];
}
