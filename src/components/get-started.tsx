"use client";
import { ArrowRight } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n/client";
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
            <Button className="bg-pink-600 hover:bg-pink-700 text-white">
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
