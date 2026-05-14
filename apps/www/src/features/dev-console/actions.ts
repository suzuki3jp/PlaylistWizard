"use server";

import { revalidatePath } from "next/cache";
import { requireDeveloperActionUser } from "@/lib/developer";
import { FeatureFlagName } from "@/lib/feature-flags";
import { featureFlagDbRepository } from "@/repository/db/feature-flag/repository";

const validFlagNames = new Set<string>(Object.values(FeatureFlagName));

function parseFeatureFlagName(
  value: FormDataEntryValue | null,
): FeatureFlagName {
  if (typeof value === "string" && validFlagNames.has(value)) {
    return value as FeatureFlagName;
  }

  throw new Error("Invalid feature flag name");
}

export async function setFeatureFlagForCurrentDeveloper(
  formData: FormData,
): Promise<void> {
  const user = await requireDeveloperActionUser();
  const flagName = parseFeatureFlagName(formData.get("flagName"));
  const enabled = formData.get("enabled") === "true";

  if (enabled) {
    await featureFlagDbRepository.insert(flagName, user.id);
  } else {
    await featureFlagDbRepository.delete(flagName, user.id);
  }

  revalidatePath("/[lang]/dev/console", "page");
}
