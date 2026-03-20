import type { WithT } from "i18next";
import type { LucideIcon } from "lucide-react";

export interface PlaylistActionComponentProps extends WithT {
  icon: LucideIcon;
  label: string;
  disabled: boolean;
}

export interface PlaylistAction {
  id: string;
  icon: LucideIcon;
  label: string;
  disabled: boolean;
  Component: React.ComponentType<PlaylistActionComponentProps>;
  separatorAfter?: boolean;
}
