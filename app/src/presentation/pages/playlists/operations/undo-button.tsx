"use client";
import { Undo2 as UndoIcon } from "lucide-react";

import type { WithT } from "@/lib/types/t";
import { Button } from "@/presentation/shadcn/button";
import { useTask } from "../contexts";
import { useHistory } from "../history";

export function UndoButton({ t }: UndoButtonProps) {
  const history = useHistory();
  const tasks = useTask();

  const style =
    "bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white";

  return (
    <Button
      variant="outline"
      size="sm"
      className={style}
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
