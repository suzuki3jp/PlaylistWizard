"use client";
import { useRouter } from "next/navigation";

import { useLang } from "@/presentation/atoms";
import { GradientButton } from "@/presentation/common/gradient-button";
import { makeLocalizedUrl } from "@/presentation/common/makeLocalizedUrl";
import { useT } from "@/presentation/hooks/t/client";
import { useAuth } from "@/presentation/hooks/useAuth";
import { signOut } from "next-auth/react";

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
