"use client";
import { Settings as SettigsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SOURCE_CODE_GITHUB } from "@/constants";
import { useT } from "@/hooks";
import {
    AVAILABLE_LANGUAGES,
    QUERY_NAME,
    getSafeLang,
} from "@/locales/settings";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "./link";

/**
 * The settings menu component.
 * It is used in the header for a small screen.
 */
export const SettingsMenu = () => {
    const { t } = useT();
    const { setTheme } = useTheme();
    const oldParams = useSearchParams();
    const router = useRouter();

    const createLanguageClickHandler = (lang: string) => {
        return () => {
            const newLang = getSafeLang(lang);
            const params = new URLSearchParams(oldParams);
            params.set(QUERY_NAME, newLang);
            router.push(`?${params.toString()}`);
            router.refresh();
        };
    };

    const createThemeClickHandler = (theme: string) => {
        return () => {
            setTheme(theme);
        };
    };

    return (
        <div className="md:hidden">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <SettigsIcon />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>
                        {t("header.settings.title")}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        {/**
                         * The language settings menu.
                         */}
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                {t("header.settings.languages")}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    {AVAILABLE_LANGUAGES.map((lang) => (
                                        <DropdownMenuItem
                                            key={lang}
                                            onSelect={createLanguageClickHandler(
                                                lang,
                                            )}
                                        >
                                            {t(`header.languages.${lang}`)}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        {/**
                         * The theme settings menu.
                         */}
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                {t("header.settings.theme")}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    {["light", "dark"].map((lang) => (
                                        <DropdownMenuItem
                                            key={lang}
                                            onSelect={createThemeClickHandler(
                                                lang,
                                            )}
                                        >
                                            {t(`header.theme.${lang}`)}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuItem>
                            <Link href={SOURCE_CODE_GITHUB}>
                                {t("header.settings.github")}
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
