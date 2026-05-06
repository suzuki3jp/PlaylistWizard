"use client";

import { useQuery } from "@tanstack/react-query";
import { FeatureFlagName } from "@/lib/feature-flags";
import { useFeatureFlag } from "@/presentation/hooks/useFeatureFlag";
import { getBackendJobs } from "@/usecase/actions/get-backend-jobs";

export function useBackendJobs() {
  const isEnabled = useFeatureFlag(FeatureFlagName.playlistActionJob);

  return useQuery({
    queryKey: ["backendJobs"],
    queryFn: getBackendJobs,
    refetchInterval: 2000,
    enabled: isEnabled,
  });
}
