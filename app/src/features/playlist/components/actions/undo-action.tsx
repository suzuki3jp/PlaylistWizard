"use client";
import type { TFunction } from "i18next";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { ga4Events } from "@/constants";
import { useHistory } from "../../contexts/history";
import { PlaylistActionButton } from "../playlist-action-button";
import type { PlaylistActionComponentProps } from "./types";

function useUndoAction(t: TFunction) {
  const history = useHistory();

  return () => {
    if (window.confirm(t("beta-confirm"))) {
      emitGa4Event(ga4Events.undo);
      history.undo();
    }
  };
}

export function UndoAction({
  t,
  icon: Icon,
  label,
  disabled,
}: PlaylistActionComponentProps) {
  const handleUndo = useUndoAction(t);

  return (
    <PlaylistActionButton onClick={handleUndo} disabled={disabled}>
      <Icon />
      {label}
    </PlaylistActionButton>
  );
}
