import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  evaluateAllFeatureFlags,
  evaluateFeatureFlag,
} from "./feature-flag-evaluator";
import * as featureFlags from "./feature-flags";
import { FeatureFlagName } from "./feature-flags";

const mockFlags = (overrides: Partial<featureFlags.FeatureFlagConfig>) => {
  vi.spyOn(featureFlags, "FEATURE_FLAGS", "get").mockReturnValue({
    [FeatureFlagName.temp]: {
      // @ts-expect-error
      enabled: true,
      rollout: 0,
      ...overrides,
    },
  });
};

const emptyEnabledFlags = new Set<FeatureFlagName>();

describe("evaluateFeatureFlag", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("enabled: false → always false (kill switch)", () => {
    mockFlags({ enabled: false, rollout: 1.0 });
    expect(
      evaluateFeatureFlag(
        FeatureFlagName.temp,
        "user1",
        new Set([FeatureFlagName.temp]),
      ),
    ).toBe(false);
    expect(
      evaluateFeatureFlag(FeatureFlagName.temp, "user2", emptyEnabledFlags),
    ).toBe(false);
  });

  it("enabledFlags has flag → true", () => {
    mockFlags({ enabled: true, rollout: 0 });
    expect(
      evaluateFeatureFlag(
        FeatureFlagName.temp,
        "user1",
        new Set([FeatureFlagName.temp]),
      ),
    ).toBe(true);
  });

  it("enabledFlags does not have flag, rollout: 0 → false", () => {
    mockFlags({ enabled: true, rollout: 0 });
    expect(
      evaluateFeatureFlag(FeatureFlagName.temp, "user1", emptyEnabledFlags),
    ).toBe(false);
  });

  it("rollout: 1.0 → true for any userId", () => {
    mockFlags({ enabled: true, rollout: 1.0 });
    expect(
      evaluateFeatureFlag(FeatureFlagName.temp, "user1", emptyEnabledFlags),
    ).toBe(true);
    expect(
      evaluateFeatureFlag(FeatureFlagName.temp, "user2", emptyEnabledFlags),
    ).toBe(true);
    expect(
      evaluateFeatureFlag(FeatureFlagName.temp, "anyuser", emptyEnabledFlags),
    ).toBe(true);
  });

  it("userId: undefined → false (unauthenticated)", () => {
    mockFlags({ enabled: true, rollout: 1.0 });
    expect(
      evaluateFeatureFlag(FeatureFlagName.temp, undefined, emptyEnabledFlags),
    ).toBe(false);
  });

  it("same userId+flagName always returns same result (deterministic)", () => {
    mockFlags({ enabled: true, rollout: 0.5 });
    const result1 = evaluateFeatureFlag(
      FeatureFlagName.temp,
      "stableUser",
      emptyEnabledFlags,
    );
    const result2 = evaluateFeatureFlag(
      FeatureFlagName.temp,
      "stableUser",
      emptyEnabledFlags,
    );
    expect(result1).toBe(result2);
  });
});

describe("evaluateAllFeatureFlags", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a record for all flags", () => {
    const result = evaluateAllFeatureFlags("user1", emptyEnabledFlags);
    expect(result).toHaveProperty(FeatureFlagName.temp);
  });

  it("userId: undefined → all false", () => {
    mockFlags({ enabled: true, rollout: 1.0 });
    const result = evaluateAllFeatureFlags(undefined, emptyEnabledFlags);
    for (const value of Object.values(result)) {
      expect(value).toBe(false);
    }
  });
});
