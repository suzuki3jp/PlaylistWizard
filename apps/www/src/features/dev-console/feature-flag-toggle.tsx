"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import type { FeatureFlagName } from "@/lib/feature-flags";
import { setFeatureFlagForCurrentDeveloper } from "./actions";

type FeatureFlagToggleProps = {
  flagName: FeatureFlagName;
  enabled: boolean;
};

export function FeatureFlagToggle({
  flagName,
  enabled,
}: FeatureFlagToggleProps) {
  const [checked, setChecked] = useState(enabled);
  const [isPending, startTransition] = useTransition();

  function handleCheckedChange(nextChecked: boolean) {
    setChecked(nextChecked);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("flagName", flagName);
      formData.set("enabled", String(nextChecked));

      try {
        await setFeatureFlagForCurrentDeveloper(formData);
      } catch {
        setChecked(!nextChecked);
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <span className="min-w-7 text-right text-gray-400 text-sm">
        {checked ? "On" : "Off"}
      </span>
      <Switch
        aria-label={`Toggle ${flagName}`}
        checked={checked}
        disabled={isPending}
        onCheckedChange={handleCheckedChange}
      />
    </div>
  );
}
