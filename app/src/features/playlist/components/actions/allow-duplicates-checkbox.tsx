import type { WithT } from "i18next";
import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { HelpTooltipButton } from "./help-tooltip-button";

interface AllowDuplicatesCheckboxProps extends WithT {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function AllowDuplicatesCheckbox({
  checked,
  onCheckedChange,
  t,
}: AllowDuplicatesCheckboxProps) {
  const id = useId();

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(checked as boolean)}
        className="border-gray-600 bg-gray-800 shadow-[0_0_3px_rgba(255,255,255,0.4)] hover:shadow-[0_0_4px_rgba(255,255,255,0.5)] data-[state=checked]:border-pink-600 data-[state=checked]:bg-pink-600"
      />
      <div className="flex items-center gap-2">
        <label
          htmlFor={id}
          className="cursor-pointer font-medium text-sm text-white"
        >
          {t("action-modal.common.allow-duplicates.title")}
        </label>
        <HelpTooltipButton
          description={t("action-modal.common.allow-duplicates.description")}
          t={t}
        />
      </div>
    </div>
  );
}
