"use client";
import { useRouter } from "next/navigation";

import { makeLocalizedUrl } from "@/helpers/makeLocalizedUrl";
import { GradientButton } from "@/presentation/common/gradient-button";
import { signOut } from "next-auth/react";
import { useT } from "../hooks/t/client";
import { useAuth } from "../hooks/useAuth";

export function AuthButton({ lang }: { lang: string }) {
  const { t } = useT(lang);
  const auth = useAuth();
  const router = useRouter();

  return auth ? (
    <GradientButton onClick={() => signOut({ callbackUrl: "/" })}>
      {t("header.sign-out")}
    </GradientButton>
  ) : (
    <GradientButton
      onClick={() => router.push(makeLocalizedUrl(lang, "/sign-in"))}
    >
      {t("header.sign-in")}
    </GradientButton>
  );
}
