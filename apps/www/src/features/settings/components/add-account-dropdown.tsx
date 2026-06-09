"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@playlistwizard/ui";
import { PlusCircle } from "lucide-react";
import { urls } from "@/constants";
import { makeAuthCallbackUrl } from "@/lib/auth-callback-url";
import { linkSocial } from "@/lib/auth-client";
import { useT } from "@/presentation/hooks/t/client";
import { ALL_PROVIDERS, PROVIDER_META } from "../constants";

interface AddAccountDropdownProps {
  lang: string;
}

export function AddAccountDropdown({ lang }: AddAccountDropdownProps) {
  const { t } = useT("settings");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-fit">
          <PlusCircle className="size-4" />
          {t("linked-accounts.add-account")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="border-gray-700 bg-gray-800 text-white">
        {ALL_PROVIDERS.map((providerId) => {
          const meta = PROVIDER_META[providerId];
          return (
            <DropdownMenuItem
              key={providerId}
              onSelect={() =>
                linkSocial({
                  provider: providerId,
                  callbackURL: makeAuthCallbackUrl(urls.settings(lang)),
                })
              }
              className="text-gray-300 focus:bg-gray-700 focus:text-white"
            >
              <meta.Icon className={`size-4 ${meta.iconColor}`} />
              {meta.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
