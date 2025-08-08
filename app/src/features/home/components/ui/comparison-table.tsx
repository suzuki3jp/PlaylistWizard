import { Check, X } from "lucide-react";
import type { PropsWithChildren } from "react";

import type { WithT } from "@/@types";
import type { ComparisonItem } from "../comparison";
import { ComparisonRowAnimation } from "./comparison-row-animation";

export function ComparisonTable({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
        {children}
      </div>
    </div>
  );
}

export function ComparisonTableHeader({ t }: WithT) {
  const cellBaseStyle = "border-gray-700 border-b p-6";

  return (
    <div className="grid grid-cols-4 gap-0">
      <div className={`${cellBaseStyle} bg-gray-750`}>
        <h3 className="font-semibold text-white">
          {t("comparison.header.features")}
        </h3>
      </div>
      <div className={`${cellBaseStyle} border-l bg-gray-750`}>
        <h3 className="text-center font-semibold text-gray-300">
          {t("comparison.header.official")}
        </h3>
      </div>
      <div className={`${cellBaseStyle} border-l bg-gray-750`}>
        <h3 className="text-center font-semibold text-gray-300">
          {t("comparison.header.thirdParty")}
        </h3>
      </div>
      <div
        className={`${cellBaseStyle} border-l bg-gradient-to-r from-pink-500/10 to-purple-500/10`}
      >
        <h3 className="text-center font-semibold text-white">
          {t("comparison.header.playlistWizard")}
        </h3>
      </div>
    </div>
  );
}

export function ComparisonRow({
  item,
  index,
}: {
  item: ComparisonItem;
  index: number;
}) {
  const OfficialIcon = item.official ? Check : X;
  const ThirdPartyIcon = item.thirdParty ? Check : X;
  const PlaylistWizardIcon = item.playlistWizard ? Check : X;

  return (
    <ComparisonRowAnimation key={item.title} index={index}>
      <div className="grid grid-cols-4 gap-0">
        <div className="border-gray-700 border-b p-6">
          <span className="font-medium text-white">{item.title}</span>
        </div>
        <ComparisonCell isSupported={item.official} />
        <ComparisonCell isSupported={item.thirdParty} />
        <ComparisonCell isSupported={item.playlistWizard} isPlaylistWizard />
      </div>
    </ComparisonRowAnimation>
  );
}

function ComparisonCell({
  isSupported,
  isPlaylistWizard = false,
}: { isSupported: boolean; isPlaylistWizard?: boolean }) {
  const Icon = isSupported ? Check : X;
  const color = isSupported ? "text-green-400" : "text-red-400";

  // If the cell is for PlaylistWizard, we want to show a different style
  if (isPlaylistWizard) {
    return (
      <div className="flex items-center justify-center border-gray-700 border-b border-l bg-gradient-to-r from-pink-500/5 to-purple-500/5 p-6">
        <Icon className={`h-6 w-6 flex-shrink-0 ${color}`} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center border-gray-700 border-b border-l p-6">
      <Icon className={`h-6 w-6 flex-shrink-0 ${color}`} />
    </div>
  );
}
