"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCookies } from "react-cookie";

import { COOKIE_NAME, supportedLangs } from "@/features/localization/i18n";
import { useLang } from "@/presentation/atoms";
import { useT } from "@/presentation/hooks/t/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/shadcn/select";

import "./language-switcher.css";

export function LanguageSwitcher() {
  return (
    <Suspense>
      <LS />
    </Suspense>
  );
}

function LS() {
  const [lang, setLang] = useLang();
  const { t } = useT();
  const [_, setCookie] = useCookies();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const langs: Record<string, string> = {};
  for (const lang of supportedLangs) {
    langs[lang] = t(`header.language.${lang}`);
  }

  function handleChange(value: string) {
    setLang(value);
    setCookie(COOKIE_NAME, value);

    const pathParts = pathname.split("/");
    pathParts[1] = value;

    window.location.href = `${pathParts.join("/")}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  }

  return (
    <div className="text-white">
      <Select value={lang} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue aria-label={lang} />
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
