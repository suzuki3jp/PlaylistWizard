"use client";
import { useT } from "@/hooks";
import {
    AVAILABLE_LANGUAGES,
    QUERY_NAME,
    getSafeLang,
} from "@/locales/settings";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";

/**
 * The language selection component.
 * It is used in the header.
 * @returns
 */
export const SelectLanguage = () => {
    const { t, lang } = useT();
    const [currentLang, setCurrentLang] = useState(lang);
    const oldParams = useSearchParams();
    const router = useRouter();

    const langs: Record<string, string> = {};
    for (const lang of AVAILABLE_LANGUAGES) {
        langs[lang] = t(`header.select-language.options.${lang}`);
    }

    const handleChange = (value: string) => {
        const newLang = getSafeLang(value);
        setCurrentLang(newLang);
        const params = new URLSearchParams(oldParams);
        params.set(QUERY_NAME, newLang);
        router.push(`?${params.toString()}`);
        router.refresh();
    };

    return (
        <Select value={currentLang} onValueChange={handleChange}>
            <SelectTrigger>
                <SelectValue aria-label={currentLang} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {Object.entries(langs).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                            {label}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
};
