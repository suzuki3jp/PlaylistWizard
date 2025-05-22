"use client";
import { ArrowRight } from "lucide-react";

import { useT } from "@/features/localization/hooks/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthButton } from "./auth-button";
import { Link } from "./link";
import { Button } from "./ui/button";

interface GetStartedProps {
  lang: string;
}

export function GetStarted({ lang }: GetStartedProps) {
  const auth = useAuth();
  const { t } = useT(lang);

  return auth ? (
    <Link href="/playlists">
      <Button className="bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700">
        {t("hero.get-started")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Link>
  ) : (
    <AuthButton
      lang={lang}
      text={
        <>
          {t("hero.get-started")}
          <ArrowRight />
        </>
      }
    />
  );
}
