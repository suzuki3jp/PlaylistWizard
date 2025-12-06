"use client";
import { useHydrateAtoms } from "jotai/utils";

import { langAtom } from "@/features/localization/atoms/lang";

/**
 * Initializes the langAtom based on the current pathname.
 */
export function LangAtomHydrator({ lang }: LangAtomHydratorProps) {
  useHydrateAtoms([[langAtom, lang]]);
  return null; // This component does not render anything
}

interface LangAtomHydratorProps {
  lang: string;
}
