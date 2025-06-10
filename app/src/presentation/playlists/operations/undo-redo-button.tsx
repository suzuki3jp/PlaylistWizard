"use client";
import { Redo2 as RedoIcon, Undo2 as UndoIcon } from "lucide-react";

import { Button } from "@/presentation/shadcn/button";
import { useHistory } from "../history";

export function UndoRedoButton() {
  const history = useHistory();

  const style =
    "bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={style}
        onClick={() => history.undo()}
        disabled={!history.undoable()}
      >
        <UndoIcon />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={style}
        onClick={() => console.log("REDOOOOOO")}
        disabled={!history.redoable()}
      >
        <RedoIcon />
      </Button>
    </>
  );
}
