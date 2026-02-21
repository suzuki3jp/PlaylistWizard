"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { unlinkAccount } from "@/lib/auth-client";
import type { UserProviderProfile } from "@/lib/user";
import { useT } from "@/presentation/hooks/t/client";
import type { DisconnectTarget } from "../constants";
import { AddAccountDropdown } from "./add-account-dropdown";
import { DisconnectDialog } from "./disconnect-dialog";
import { ProviderRow } from "./provider-row";

interface LinkedAccountsCardProps {
  providers: UserProviderProfile[];
  lang: string;
}

export function LinkedAccountsCard({
  providers,
  lang,
}: LinkedAccountsCardProps) {
  const { t } = useT("settings");
  const router = useRouter();
  const [disconnectTarget, setDisconnectTarget] =
    useState<DisconnectTarget | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isLastProvider = providers.length === 1;

  async function handleDisconnect() {
    if (!disconnectTarget) return;
    setIsPending(true);
    try {
      await unlinkAccount({
        providerId: disconnectTarget.providerId,
        accountId: disconnectTarget.accountId,
      });
      router.refresh();
    } finally {
      setIsPending(false);
      setDisconnectTarget(null);
    }
  }

  return (
    <>
      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="space-y-1">
          <h2 className="font-semibold text-lg text-white">
            {t("linked-accounts.title")}
          </h2>
          <p className="text-gray-400 text-sm">
            {t("linked-accounts.description")}
          </p>
          <p className="text-gray-500 text-xs">{t("linked-accounts.note")}</p>
        </div>
        <div className="space-y-3">
          {providers.map((provider) => (
            <ProviderRow
              key={provider.accountId}
              provider={provider}
              isLastProvider={isLastProvider}
              onDisconnect={setDisconnectTarget}
            />
          ))}
        </div>
        <AddAccountDropdown lang={lang} />
      </div>
      <DisconnectDialog
        target={disconnectTarget}
        isPending={isPending}
        onConfirm={handleDisconnect}
        onCancel={() => setDisconnectTarget(null)}
      />
    </>
  );
}
