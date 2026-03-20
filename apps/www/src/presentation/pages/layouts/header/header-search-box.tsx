"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/features/localization/atoms/lang";
import { useSearchParams } from "@/features/search/hooks/use-search-params";
import { useT } from "@/presentation/hooks/t/client";

export function HeaderSearchBox() {
  const pathname = usePathname();
  const router = useRouter();
  const [{ q: currentQuery }] = useSearchParams();
  const { t } = useT("search");
  const [lang] = useLang();
  const [inputValue, setInputValue] = useState(currentQuery);

  useEffect(() => setInputValue(currentQuery), [currentQuery]);

  if (pathname.endsWith("/search")) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;
    router.push(`/${lang}/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-1 items-center">
      <div className="relative w-full">
        <Search className="-translate-y-1/2 absolute top-1/2 left-2.5 h-4 w-4 text-gray-400" />
        <input
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          aria-label={t("search-box.placeholder")}
          placeholder={t("search-box.placeholder")}
          className="w-full rounded-lg border border-gray-800 bg-gray-900 py-1.5 pr-3 pl-8 text-sm text-white placeholder-gray-500 focus:border-gray-600 focus:outline-none"
        />
      </div>
    </form>
  );
}
