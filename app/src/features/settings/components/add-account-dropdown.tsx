"use client";

import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { urls } from "@/constants";
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
        <Button variant="outline" size="sm">
          <PlusCircle className="size-4" />
          {t("linked-accounts.add-account")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {ALL_PROVIDERS.map((providerId) => {
          const meta = PROVIDER_META[providerId];
          return (
            <DropdownMenuItem
              key={providerId}
              onSelect={() =>
                linkSocial({
                  provider: providerId,
                  callbackURL: urls.settings(lang),
                })
              }
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
