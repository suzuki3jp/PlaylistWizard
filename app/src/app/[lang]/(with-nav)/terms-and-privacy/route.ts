import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { fallbackLang, supportedLangs } from "@/features/localization/i18n";

export function GET(request: NextRequest) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean); // ['', 'ja', 'terms-and-privacy'] → ['ja', 'terms-and-privacy']
  const lang = supportedLangs.some(
    (supportedLang) => supportedLang === segments[0],
  )
    ? segments[0]
    : fallbackLang;

  return NextResponse.redirect(new URL(`/${lang}/terms`, url.origin));
}
