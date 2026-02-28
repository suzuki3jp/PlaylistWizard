"use client";
import { useAtom } from "jotai";
import { SnackbarProvider } from "notistack";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AccountTabs,
  type FocusedAccount,
  focusedAccountAtom,
} from "@/features/accounts";
import { useT } from "@/presentation/hooks/t/client";
import { DependencyTree } from "./dependency-tree";
import { PlaylistList } from "./playlist-list";

export function StructuredPlaylistEditor() {
  const { t } = useT("structured-playlists");

  const [focusedAccount, setFocusedAccount] = useAtom(focusedAccountAtom);
  const [pendingSwitch, setPendingSwitch] = useState<FocusedAccount | null>(
    null,
  );
  const isDirtyRef = useRef(false);
  const handleSaveRef = useRef<(() => Promise<void>) | null>(null);

  return (
    <div className="space-y-4">
      <AccountTabs
        onValueChange={(acc) => {
          if (isDirtyRef.current) {
            setPendingSwitch(acc);
          } else {
            setFocusedAccount(acc);
          }
        }}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SnackbarProvider>
          <PlaylistList t={t} />
          <DependencyTree
            key={focusedAccount?.id}
            t={t}
            onDirtyChange={(dirty) => {
              isDirtyRef.current = dirty;
            }}
            onSaveRefChange={(fn) => {
              handleSaveRef.current = fn;
            }}
          />
        </SnackbarProvider>
      </div>

      <Dialog
        open={pendingSwitch !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSwitch(null);
        }}
      >
        <DialogContent className="border border-gray-800 bg-gray-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("editor.account-switch.unsaved-title")}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {t("editor.account-switch.unsaved-description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingSwitch(null)}
              className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
            >
              {t("editor.account-switch.cancel")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (pendingSwitch) setFocusedAccount(pendingSwitch);
                setPendingSwitch(null);
              }}
              className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
            >
              {t("editor.account-switch.discard")}
            </Button>
            <Button
              onClick={async () => {
                await handleSaveRef.current?.();
                if (pendingSwitch) setFocusedAccount(pendingSwitch);
                setPendingSwitch(null);
              }}
              className="bg-pink-600 text-white hover:bg-pink-700"
            >
              {t("editor.account-switch.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
