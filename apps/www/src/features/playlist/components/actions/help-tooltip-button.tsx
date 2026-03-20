import type { WithT } from "i18next";
import { HelpCircle } from "lucide-react";
import { Tooltip } from "@/components/tooltip";
import { Button } from "@/components/ui/button";

interface HelpTooltipButtonProps extends WithT {
  description: string;
}

export function HelpTooltipButton({ description, t }: HelpTooltipButtonProps) {
  return (
    <Tooltip
      description={description}
      className="border-gray-700 bg-gray-800 text-white"
    >
      <Button
        variant="ghost"
        className="h-6 w-6 p-0 text-gray-400 hover:text-white"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="sr-only">{t("action-modal.common.help")}</span>
      </Button>
    </Tooltip>
  );
}
