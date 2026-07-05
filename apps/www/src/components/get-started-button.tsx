"use client";

import { ArrowRight } from "lucide-react";
import NextLink from "next/link";
import { urls } from "@/constants";
import { useLang } from "@/features/localization/atoms/lang";
import { useT } from "@/presentation/hooks/t/client";

/**
 * CTA button that leads users to the sign-in page.
 *
 * Set `hideIfSignedIn` (together with `isSignedIn`) in placements where the
 * button is redundant for signed-in users, such as global navigation.
 */
export function GetStartedButton({
  isSignedIn = false,
  hideIfSignedIn = false,
}: {
  isSignedIn?: boolean;
  hideIfSignedIn?: boolean;
}) {
  const { t } = useT();
  const [lang] = useLang();

  if (hideIfSignedIn && isSignedIn) return null;

  return (
    <NextLink
      href={urls.signIn(lang, urls.playlists())}
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
    >
      {t("header.get-started")}
      <ArrowRight className="size-4" />
    </NextLink>
  );
}
