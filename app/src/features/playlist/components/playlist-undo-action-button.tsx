"use client";
import type { WithT } from "i18next";
import { Undo2 as UndoIcon } from "lucide-react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { ga4Events } from "@/constants";
import { useHistory } from "../contexts/history";
import { useTask } from "../contexts/tasks";
import { PlaylistActionButton } from "./playlist-action-button";

export function UndoButton({ t }: UndoButtonProps) {
  const history = useHistory();
  const tasks = useTask();

  return (
    <PlaylistActionButton
      onClick={() => {
        if (window.confirm(t("beta-confirm"))) {
          emitGa4Event(ga4Events.undo);
          history.undo();
        }
      }}
      disabled={!(history.undoable() && tasks.tasks.length === 0)}
    >
      <UndoIcon />
    </PlaylistActionButton>
  );
}

interface UndoButtonProps extends WithT {}
