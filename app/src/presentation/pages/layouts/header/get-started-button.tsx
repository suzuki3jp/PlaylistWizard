"use client";

import { ArrowRight } from "lucide-react";
import NextLink from "next/link";
import { urls } from "@/constants";
import { useLang } from "@/features/localization/atoms/lang";
import { useSession } from "@/lib/auth-client";
import { useT } from "@/presentation/hooks/t/client";

export function GetStartedButton() {
  const { t } = useT();
  const [lang] = useLang();
  const { data: session } = useSession();

  if (session?.user) return null;

  return (
    <NextLink
      href={urls.signIn(lang, urls.playlists())}
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-2 font-semibold text-sm text-white hover:opacity-90"
    >
      {t("header.get-started")}
      <ArrowRight className="size-4" />
    </NextLink>
  );
}
