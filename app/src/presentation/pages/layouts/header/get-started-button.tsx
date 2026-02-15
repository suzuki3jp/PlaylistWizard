"use client";

import { ArrowRight } from "lucide-react";
import NextLink from "next/link";
import { urls } from "@/constants";
import { useLang } from "@/features/localization/atoms/lang";
import { useT } from "@/presentation/hooks/t/client";
import { useAuth } from "@/presentation/hooks/useAuth";

export function GetStartedButton() {
  const { t } = useT();
  const [lang] = useLang();
  const auth = useAuth();

  if (auth?.user) return null;

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
