"use client";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { EvaluatedFeatureFlags } from "@/lib/feature-flags";

export const FeatureFlagContext = createContext<EvaluatedFeatureFlags | null>(
  null,
);

export interface FeatureFlagProviderProps {
  flags: EvaluatedFeatureFlags;
  children: ReactNode;
}

export function FeatureFlagProvider({
  flags,
  children,
}: FeatureFlagProviderProps) {
  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlagContext(): EvaluatedFeatureFlags {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx)
    throw new Error("useFeatureFlagContext must be used within FeatureFlagProvider");
  return ctx;
}
