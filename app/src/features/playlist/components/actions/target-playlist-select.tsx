import type { WithT } from "i18next";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT } from "@/constants";
import { HelpTooltipButton } from "./help-tooltip-button";

interface TargetPlaylistSelectProps extends WithT {
  targetId: string;
  onTargetIdChange: (id: string) => void;
  playlists: Array<{ id: string; title: string }> | undefined;
}

export function TargetPlaylistSelect({
  targetId,
  onTargetIdChange,
  playlists,
  t,
}: TargetPlaylistSelectProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* biome-ignore lint/a11y/noLabelWithoutControl: TODO */}
        <label className="font-medium text-sm text-white">
          {t("action-modal.common.target.title")}
        </label>
        <HelpTooltipButton
          description={t("action-modal.common.target.description")}
          t={t}
        />
      </div>
      <Select value={targetId} onValueChange={onTargetIdChange}>
        <SelectTrigger className="w-full border-gray-700 bg-gray-800 text-white focus:ring-pink-500">
          <SelectValue aria-label={targetId} />
        </SelectTrigger>
        <SelectContent className="border-gray-700 bg-gray-800 text-white">
          <SelectGroup>
            <SelectItem value={DEFAULT} className="focus:bg-pink-600">
              {t("action-modal.common.create-new-playlist")}
            </SelectItem>
            <SelectLabel className="text-gray-400">
              {t("action-modal.common.existing-playlists")}
            </SelectLabel>
            {playlists?.map((playlist) => (
              <SelectItem
                key={playlist.id}
                value={playlist.id}
                className="focus:bg-pink-600"
              >
                {playlist.title}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
