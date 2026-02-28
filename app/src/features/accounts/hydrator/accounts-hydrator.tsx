"use client";
import { useHydrateAtoms } from "jotai/utils";
import type { UserProviderProfile } from "@/lib/user";
import { focusedAccountAtom } from "../atoms/focused-account";

interface AccountsHydratorProps {
  accounts: UserProviderProfile[];
}

export function AccountsHydrator({ accounts }: AccountsHydratorProps) {
  const first = accounts[0] ?? null;
  useHydrateAtoms([[focusedAccountAtom, first]]);
  return null;
}
