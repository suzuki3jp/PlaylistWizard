"use client";
import type { WithT } from "i18next";
import { Undo2 as UndoIcon } from "lucide-react";
import { Button } from "@/presentation/shadcn/button";
import { useHistory } from "../contexts/history";
import { useTask } from "../contexts/tasks";

export function UndoButton({ t }: UndoButtonProps) {
  const history = useHistory();
  const tasks = useTask();

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
      onClick={() => {
        if (window.confirm(t("beta-confirm"))) {
          history.undo();
        }
      }}
      disabled={!(history.undoable() && tasks.tasks.length === 0)}
    >
      <UndoIcon />
    </Button>
  );
}

interface UndoButtonProps extends WithT {}
