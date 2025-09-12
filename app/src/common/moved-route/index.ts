import { type NextRequest, NextResponse } from "next/server";

import { makeServerLogger } from "@/common/logger/server";
import { fallbackLang, supportedLangs } from "@/features/localization/i18n";
import { makeLocalizedUrl } from "@/presentation/common/makeLocalizedUrl";

/**
 * Generates a GET route handler that redirects from one path to another.
 */
export function movedRoute(to: string) {
  return (request: NextRequest) => {
    const logger = makeServerLogger("movedRoute.ts");

    const url = new URL(request.url);
    const [unsafeLang, ...path] = url.pathname.split("/").filter(Boolean);
    logger.debug("Accessed moved route:", url.pathname);
    logger.debug("Segmented path:", { unsafeLang, path });

    const lang = supportedLangs.some(
      (supportedLang) => supportedLang === unsafeLang,
    )
      ? unsafeLang
      : fallbackLang;

    const redirectUrl = makeLocalizedUrl(lang, to);
    logger.debug("Redirecting to:", redirectUrl);

    return NextResponse.redirect(
      new URL(redirectUrl, url.origin),
      301, // Marked as a permanent redirect
    );
  };
}
