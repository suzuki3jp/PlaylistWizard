"use client";

import { Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { urls } from "@/constants";
import { deleteUser } from "@/lib/auth-client";
import { useT } from "@/presentation/hooks/t/client";

interface DangerZoneCardProps {
  lang: string;
}

export function DangerZoneCard({ lang }: DangerZoneCardProps) {
  const { t } = useT("settings");
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    setIsPending(true);
    try {
      await deleteUser();
      window.location.href = urls.home(lang);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <div className="space-y-4 rounded-lg border border-red-900/40 bg-zinc-900 p-6">
        <div className="flex items-center gap-2">
          <TriangleAlert className="size-5 text-red-400" />
          <h2 className="font-semibold text-lg text-white">
            {t("danger-zone.title")}
          </h2>
        </div>
        <p className="text-gray-400 text-sm">{t("danger-zone.description")}</p>
        <Button
          variant="outline"
          className="border-red-800 text-red-400 hover:bg-red-950 hover:text-red-300"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="size-4 text-red-400" />
          {t("danger-zone.delete-account")}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle>{t("danger-zone.delete-confirm.title")}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {t("danger-zone.delete-confirm.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {t("danger-zone.delete-confirm.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {t("danger-zone.delete-confirm.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
