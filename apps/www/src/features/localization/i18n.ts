export const fallbackLang = "en";
export const supportedLangs = [fallbackLang, "ja"];
export const defaultNS = "common";
export const COOKIE_NAME = "locale";

export function getOptions(lng = fallbackLang, ns = defaultNS) {
  return {
    supportedLngs: supportedLangs,
    fallbackLng: fallbackLang,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}
