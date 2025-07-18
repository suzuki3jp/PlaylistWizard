"use client";

import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import {
  initReactI18next,
  useTranslation as useTranslationOrg,
} from "react-i18next";

import {
  COOKIE_NAME,
  defaultNS,
  getOptions,
  supportedLangs,
} from "@/localization/i18n";
import { langAtom } from "@/presentation/atoms";
import { useAtomValue } from "jotai";

const runsOnServerSide = typeof window === "undefined";

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      (language: any, namespace: any) =>
        import(`@/localization/resources/${language}/${namespace}.json`),
    ),
  )
  .init({
    ...getOptions(),
    lng: undefined,
    detection: {
      order: ["path", "htmlTag", "cookie", "navigator"],
    },
    preload: runsOnServerSide ? supportedLangs : [],
  });

/**
 * Get i18next instance and t function for client-side rendering localization.
 * @param ns
 * @returns
 */
export function useT( ns: string = defaultNS) {
  const lang = useAtomValue(langAtom);

  const [cookies, setCookie] = useCookies([COOKIE_NAME]);
  const ret = useTranslationOrg(ns);
  const { i18n } = ret;
  if (runsOnServerSide && lang && i18n.resolvedLanguage !== lang) {
    i18n.changeLanguage(lang);
  } else {
    const [activeLng, setActiveLng] = useState(i18n.resolvedLanguage);
    useEffect(() => {
      if (activeLng === i18n.resolvedLanguage) return;
      setActiveLng(i18n.resolvedLanguage);
    }, [activeLng, i18n.resolvedLanguage]);
    useEffect(() => {
      if (!lang || i18n.resolvedLanguage === lang) return;
      i18n.changeLanguage(lang);
    }, [lang, i18n]);
    useEffect(() => {
      if (cookies.locale === lang) return;
      setCookie(COOKIE_NAME, lang, { path: "/" });
    }, [lang, cookies.locale, setCookie]);
  }
  return ret;
}
