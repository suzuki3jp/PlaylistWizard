"use client";

import {
  Badge,
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@playlistwizard/ui";
import { UserCircle } from "lucide-react";
import Image from "next/image";
import type { UserProviderProfile } from "@/lib/user";
import { useT } from "@/presentation/hooks/t/client";
import type { DisconnectTarget } from "../constants";
import { getProviderMeta } from "../constants";

interface ProviderRowProps {
  provider: UserProviderProfile;
  isLastProvider: boolean;
  onDisconnect: (target: DisconnectTarget) => void;
}

export function ProviderRow({
  provider,
  isLastProvider,
  onDisconnect,
}: ProviderRowProps) {
  const { t } = useT("settings");
  const meta = getProviderMeta(provider.providerId);
  const label = meta?.label ?? provider.providerId;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-gray-800 bg-gray-900/40 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <ProviderAvatar
          image={provider.image}
          name={provider.name ?? provider.providerId}
        />
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {provider.name && (
              <span className="min-w-0 truncate text-sm text-white">
                {provider.name}
              </span>
            )}
            {provider.email && (
              <span className="min-w-0 truncate text-sm text-gray-400">
                {provider.email}
              </span>
            )}
            <Badge className="hidden border-green-800 bg-green-900/40 text-green-400 sm:inline-flex">
              {t("linked-accounts.connected")}
            </Badge>
          </div>
          <span className="hidden text-xs text-gray-500 sm:block">{label}</span>
        </div>
      </div>
      {isLastProvider ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button variant="outline" size="sm" disabled className="shrink-0">
                {t("linked-accounts.disconnect")}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-800 text-gray-100">
            {t("linked-accounts.last-provider-tooltip")}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() =>
            onDisconnect({
              id: provider.id,
              providerId: provider.providerId,
              accountId: provider.accountId,
            })
          }
        >
          {t("linked-accounts.disconnect")}
        </Button>
      )}
    </div>
  );
}

interface ProviderAvatarProps {
  image: string | null;
  name: string;
}

function ProviderAvatar({ image, name }: ProviderAvatarProps) {
  if (image) {
    return (
      <Image
        src={image}
        width={36}
        height={36}
        alt={name}
        className="rounded-full"
      />
    );
  }
  return <UserCircle className="size-9 text-gray-400" />;
}
