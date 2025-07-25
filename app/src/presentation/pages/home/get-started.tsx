"use client";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { useLang } from "@/presentation/atoms";
import { GradientButton } from "@/presentation/common/gradient-button";
import { Link } from "@/presentation/common/link";
import { makeLocalizedUrl } from "@/presentation/common/makeLocalizedUrl";
import { useT } from "@/presentation/hooks/t/client";
import { useAuth } from "@/presentation/hooks/useAuth";
import { Button } from "@/presentation/shadcn/button";

export function GetStarted() {
  const [lang] = useLang();
  const auth = useAuth();
  const { t } = useT();
  const router = useRouter();

  return auth ? (
    <Link href="/playlists">
      <Button className="bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700">
        {t("hero.get-started")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Link>
  ) : (
    <GradientButton
      onClick={() => router.push(makeLocalizedUrl(lang, "/sign-in"))}
    >
      {t("hero.get-started")}
      <ArrowRight className="ml-2 h-4 w-4" />
    </GradientButton>
  );
}
