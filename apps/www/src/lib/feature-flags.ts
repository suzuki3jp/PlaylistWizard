export type FeatureFlagConfig = {
  enabled: boolean;
  description?: string;
  rollout: number; // 0.0〜1.0
};

export const FeatureFlagName = {
  playlistActionJob: "playlistActionJob",
} as const;

export type FeatureFlagName =
  (typeof FeatureFlagName)[keyof typeof FeatureFlagName];

export const FEATURE_FLAGS: Record<FeatureFlagName, FeatureFlagConfig> = {
  [FeatureFlagName.playlistActionJob]: {
    enabled: true,
    description:
      "Enable the server-side playlist action job for process queueing playlist actions.",
    rollout: 0,
  },
};

export type EvaluatedFeatureFlags = Record<FeatureFlagName, boolean>;
