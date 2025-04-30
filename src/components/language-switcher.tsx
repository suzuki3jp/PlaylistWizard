"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useCookies } from "react-cookie";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useT } from "@/i18n/client";
import { COOKIE_NAME, supportedLangs } from "@/i18n/settings";

import "./language-switcher.css";

interface LanguageSwitcherProps {
    lang: string;
}

export function LanguageSwitcher({ lang }: LanguageSwitcherProps) {
    const { t } = useT(lang);
    const [current, setCurrent] = useState(lang);
    const [_, setCookie] = useCookies();
    const router = useRouter();
    const pathname = usePathname();

    const langs: Record<string, string> = {};
    for (const lang of supportedLangs) {
        langs[lang] = t(`header.language.${lang}`);
    }

    function handleChange(value: string) {
        setCurrent(value);
        setCookie(COOKIE_NAME, value);
        const pathParts = pathname.split("/");
        pathParts[1] = value;
        router.push(pathParts.join("/"));
    }

    return (
        <div className="text-white border-none">
            <Select value={current} onValueChange={handleChange}>
                <SelectTrigger>
                    <SelectValue aria-label={current} className="border-none" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {Object.entries(langs).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                                {value}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}
