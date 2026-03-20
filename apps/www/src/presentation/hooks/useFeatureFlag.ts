"use client";
import type { FeatureFlagName } from "@/lib/feature-flags";
import { useFeatureFlagContext } from "@/presentation/providers/FeatureFlagProvider";

export function useFeatureFlag(name: FeatureFlagName): boolean {
  const flags = useFeatureFlagContext();
  return flags[name];
}
