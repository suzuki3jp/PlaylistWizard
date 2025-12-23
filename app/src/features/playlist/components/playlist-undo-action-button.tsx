"use client";
import type { WithT } from "i18next";
import { Undo2 as UndoIcon } from "lucide-react";
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
