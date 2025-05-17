import { createInstance } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";
import { defaultNS, getOptions } from "./settings";

const initI18next = async (lang: string, ns: string) => {
  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(
      resourcesToBackend(
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (language: any, namespace: any) =>
          import(`./locales/${language}/${namespace}.json`),
      ),
    )
    .init(getOptions(lang, ns));
  return i18nInstance;
};

/**
 * Get i18next instance and t function for server-side rendering localization.
 * @param lang
 * @param ns
 * @returns
 */
export async function useServerT(lang: string, ns: string = defaultNS) {
  const i18nextInstance = await initI18next(lang, ns);
  return {
    t: i18nextInstance.getFixedT(lang, Array.isArray(ns) ? ns[0] : ns),
    i18n: i18nextInstance,
  };
}
