"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/presentation/hooks/t/client";
import type { DisconnectTarget } from "../constants";
import { getProviderMeta } from "../constants";

interface DisconnectDialogProps {
  target: DisconnectTarget | null;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DisconnectDialog({
  target,
  isPending,
  onConfirm,
  onCancel,
}: DisconnectDialogProps) {
  const { t } = useT("settings");
  const providerLabel =
    getProviderMeta(target?.providerId ?? "")?.label ?? target?.providerId;

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle>
            {t("linked-accounts.disconnect-confirm.title", {
              provider: providerLabel,
            })}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {t("linked-accounts.disconnect-confirm.description", {
              provider: providerLabel,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            {t("linked-accounts.disconnect-confirm.cancel")}
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {t("linked-accounts.disconnect-confirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
