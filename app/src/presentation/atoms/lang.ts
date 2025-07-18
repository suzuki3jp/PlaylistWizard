import { atom } from "jotai";

import { fallbackLang } from "@/localization/i18n";

export const langAtom = atom<string>(fallbackLang);
