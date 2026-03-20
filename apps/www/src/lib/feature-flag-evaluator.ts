import {
  type EvaluatedFeatureFlags,
  FEATURE_FLAGS,
  type FeatureFlagName,
} from "./feature-flags";

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

export function evaluateFeatureFlag(
  flagName: FeatureFlagName,
  userId: string | undefined,
  enabledFlags: Set<FeatureFlagName>,
): boolean {
  const config = FEATURE_FLAGS[flagName];

  if (!config.enabled) return false;
  if (!userId) return false;
  if (enabledFlags.has(flagName)) return true;

  const hash = djb2Hash(`${userId}${flagName}`);
  return hash % 100 < config.rollout * 100;
}

export function evaluateAllFeatureFlags(
  userId: string | undefined,
  enabledFlags: Set<FeatureFlagName>,
): EvaluatedFeatureFlags {
  return Object.fromEntries(
    Object.keys(FEATURE_FLAGS).map((name) => [
      name,
      evaluateFeatureFlag(name as FeatureFlagName, userId, enabledFlags),
    ]),
  ) as EvaluatedFeatureFlags;
}
