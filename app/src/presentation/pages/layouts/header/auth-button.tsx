"use client";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { emitGa4Event } from "@/common/emit-ga4-event";
import { GradientButton } from "@/components/gradient-button";
import { makeLocalizedUrl } from "@/components/makeLocalizedUrl";
import { ga4Events } from "@/constants";
import { useLang } from "@/features/localization/atoms/lang";
import { useT } from "@/presentation/hooks/t/client";
import { useAuth } from "@/presentation/hooks/useAuth";

export function AuthButton() {
  const [lang] = useLang();
  const { t } = useT();
  const auth = useAuth();
  const router = useRouter();

  function handleSignOut() {
    emitGa4Event(ga4Events.userSignOut);
    signOut({ callbackUrl: "/" });
  }

  return auth ? (
    <GradientButton onClick={handleSignOut}>
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
