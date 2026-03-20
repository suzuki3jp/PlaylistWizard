export type FeatureFlagConfig = {
  enabled: boolean;
  rollout: number; // 0.0〜1.0
};

export const FeatureFlagName = {
  temp: "temp",
  serverSidePlaylistActions: "serverSidePlaylistActions",
} as const;

export type FeatureFlagName =
  (typeof FeatureFlagName)[keyof typeof FeatureFlagName];

export const FEATURE_FLAGS = {
  [FeatureFlagName.temp]: {
    enabled: true,
    rollout: 0,
  },
  [FeatureFlagName.serverSidePlaylistActions]: {
    enabled: true,
    rollout: 0,
  },
} satisfies Record<FeatureFlagName, FeatureFlagConfig>;

export type EvaluatedFeatureFlags = Record<FeatureFlagName, boolean>;
