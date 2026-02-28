import { atom, useAtom } from "jotai";
import type { UserProviderProfile } from "@/lib/user";

export type FocusedAccount = UserProviderProfile;

export const focusedAccountAtom = atom<FocusedAccount | null>(null);

export const useFocusedAccount = () => useAtom(focusedAccountAtom);
