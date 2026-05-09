import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireDeveloperActionUser } from "@/lib/developer";
import { FeatureFlagName } from "@/lib/feature-flags";
import { featureFlagDbRepository } from "@/repository/db/feature-flag/repository";
import { setFeatureFlagForCurrentDeveloper } from "./actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/developer", () => ({
  requireDeveloperActionUser: vi.fn(),
}));

vi.mock("@/repository/db/feature-flag/repository", () => ({
  featureFlagDbRepository: {
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

function createFormData(flagName: string, enabled: boolean) {
  const formData = new FormData();
  formData.set("flagName", flagName);
  formData.set("enabled", String(enabled));
  return formData;
}

describe("setFeatureFlagForCurrentDeveloper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireDeveloperActionUser).mockResolvedValue({
      id: "user-1" as never,
      name: "Developer",
      email: "developer@example.com",
    });
    vi.mocked(featureFlagDbRepository.insert).mockResolvedValue(undefined);
    vi.mocked(featureFlagDbRepository.delete).mockResolvedValue(undefined);
    vi.mocked(revalidatePath).mockReturnValue(undefined);
  });

  it("enables a valid feature flag for the current developer", async () => {
    await setFeatureFlagForCurrentDeveloper(
      createFormData(FeatureFlagName.playlistActionJob, true),
    );

    expect(requireDeveloperActionUser).toHaveBeenCalledOnce();
    expect(featureFlagDbRepository.insert).toHaveBeenCalledWith(
      FeatureFlagName.playlistActionJob,
      "user-1",
    );
    expect(featureFlagDbRepository.delete).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/[lang]/dev/console", "page");
  });

  it("disables a valid feature flag for the current developer", async () => {
    await setFeatureFlagForCurrentDeveloper(
      createFormData(FeatureFlagName.playlistActionJob, false),
    );

    expect(featureFlagDbRepository.delete).toHaveBeenCalledWith(
      FeatureFlagName.playlistActionJob,
      "user-1",
    );
    expect(featureFlagDbRepository.insert).not.toHaveBeenCalled();
  });

  it("rejects unknown feature flag names", async () => {
    await expect(
      setFeatureFlagForCurrentDeveloper(createFormData("unknown", true)),
    ).rejects.toThrow("Invalid feature flag name");

    expect(featureFlagDbRepository.insert).not.toHaveBeenCalled();
    expect(featureFlagDbRepository.delete).not.toHaveBeenCalled();
  });
});
