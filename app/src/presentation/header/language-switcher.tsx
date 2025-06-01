"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useCookies } from "react-cookie";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COOKIE_NAME, supportedLangs } from "@/localization/i18n";
import { useT } from "@/presentation/hooks/t/client";

import "./language-switcher.css";

interface LanguageSwitcherProps {
  lang: string;
}

export function LanguageSwitcher(props: LanguageSwitcherProps) {
  return (
    <Suspense>
      <LS {...props} />
    </Suspense>
  );
}

function LS({ lang }: LanguageSwitcherProps) {
  const { t } = useT(lang);
  const [current, setCurrent] = useState(lang);
  const [_, setCookie] = useCookies();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const langs: Record<string, string> = {};
  for (const lang of supportedLangs) {
    langs[lang] = t(`header.language.${lang}`);
  }

  function handleChange(value: string) {
    setCurrent(value);
    setCookie(COOKIE_NAME, value);

    const pathParts = pathname.split("/");
    pathParts[1] = value;

    router.push(`${pathParts.join("/")}?${searchParams.toString()}`);
  }

  return (
    <div className="text-white">
      <Select value={current} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue aria-label={current} />
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
