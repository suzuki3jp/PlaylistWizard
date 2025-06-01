"use client";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { makeLocalizedUrl } from "@/helpers/makeLocalizedUrl";
import { useT } from "@/presentation/hooks/t/client";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useRouter } from "next/navigation";

export interface AuthButtonProps {
  lang: string;
  text?: ReactNode;
}

export function AuthButton({ lang, text }: AuthButtonProps) {
  const { t } = useT(lang);
  const auth = useAuth();
  const router = useRouter();

  return auth ? (
    <Button
      className="bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      {t("header.sign-out")}
    </Button>
  ) : (
    <Button
      className="bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700"
      onClick={() => {
        router.push(makeLocalizedUrl(lang, "/sign-in"));
      }}
    >
      {text || t("header.sign-in")}
    </Button>
  );
}
