"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { FeedbackDialog } from "./feedback-dialog";

interface FeedbackProps {
  trigger?: (open: () => void) => ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  titlePrefix?: string;
}

export function Feedback({
  trigger,
  open: controlledOpen,
  onOpenChange,
  titlePrefix,
}: FeedbackProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled
    ? (onOpenChange ?? (() => {}))
    : setUncontrolledOpen;

  return (
    <>
      {trigger?.(() => setOpen(true))}
      <FeedbackDialog
        open={open}
        onOpenChange={setOpen}
        titlePrefix={titlePrefix}
      />
    </>
  );
}
