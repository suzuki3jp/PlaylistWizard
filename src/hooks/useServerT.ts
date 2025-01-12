import { createInstance } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";

import { QUERY_NAME, getOptions, getSafeLang } from "@/locales/settings";
import type { PageProps } from "@/types";

export const useServerT = async (
    query: PageProps["searchParams"] | URLSearchParams,
) => {
    const lang =
        query instanceof URLSearchParams
            ? query.get(QUERY_NAME)
            : (await query)[QUERY_NAME];
    const resolvedLang = getSafeLang(lang);

    const i18nInstance = createInstance();
    await i18nInstance
        .use(initReactI18next)
        .use(
            resourcesToBackend(
                (lang: string, namespace: string) =>
                    import(`@/locales/${lang}/${namespace}.json`),
            ),
        )
        .init({
            ...getOptions(),
            lng: resolvedLang,
        });

    return {
        t: i18nInstance.t,
        i18n: i18nInstance,
        lng: i18nInstance.language,
    };
};
