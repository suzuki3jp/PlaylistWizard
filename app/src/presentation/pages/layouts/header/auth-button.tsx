"use client";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { useLang } from "@/features/localization/atoms/lang";
import { GradientButton } from "@/presentation/common/gradient-button";
import { makeLocalizedUrl } from "@/presentation/common/makeLocalizedUrl";
import { useT } from "@/presentation/hooks/t/client";
import { useAuth } from "@/presentation/hooks/useAuth";

export function AuthButton() {
  const [lang] = useLang();
  const { t } = useT();
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
