"use client";
import i18next from "i18next";
import resourceToBackend from "i18next-resources-to-backend";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { initReactI18next, useTranslation } from "react-i18next";

import { QUERY_NAME, getOptions, getSafeLang } from "@/locales/settings";

i18next
    .use(initReactI18next)
    .use(
        resourceToBackend(
            (lang: string, namespace: string) =>
                import(`@/locales/${lang}/${namespace}.json`),
        ),
    )
    .init(getOptions());

export const useT = () => {
    const query = useSearchParams();
    const lang = getSafeLang(query.get(QUERY_NAME));

    // この `common` はネームスペース名です。今回は `common.json` なので `common` を設定
    // jsonファイルを増やし、ネームスペースを利用したい場合、`useT` に引数を設定しましょう
    const { t, i18n } = useTranslation("common");

    useEffect(() => {
        i18n.changeLanguage(lang);
    }, [lang, i18n]);

    return { t, i18n, lang };
};
