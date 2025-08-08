import { getServerSession } from "next-auth";

import type { WithT } from "@/@types";
import { HighlightedLink } from "@/presentation/common/highlighted-link";
import { Link } from "@/presentation/common/link";
import { makeLocalizedUrl } from "@/presentation/common/makeLocalizedUrl";
import { MaxWidthContainer } from "@/presentation/common/max-width-container";
import { PlaylistWizardLogo } from "@/presentation/common/playlistwizard-log";
import { AuthButton } from "./auth-button";
import { LanguageSwitcher } from "./language-switcher";

export type HeaderProps = WithT & { lang: string };

export async function Header({ t, lang }: HeaderProps) {
  const session = await getServerSession();

  function makeHref(path: string) {
    return makeLocalizedUrl(lang, path);
  }

  return (
    <MaxWidthContainer className="sticky top-0 z-50 border-gray-800 border-b bg-gray-950">
      <header className="flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <Link href={makeHref("/")}>
          <div className="flex items-center gap-2 font-bold text-white text-xl">
            <PlaylistWizardLogo size={32} />
            <span className="hidden sm:inline">PlaylistWizard</span>
          </div>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-6">
            <HighlightedLink
              href={makeHref("/#features")}
              className="hidden font-medium text-sm text-white sm:inline"
              underline={false}
            >
              {t("header.features")}
            </HighlightedLink>

            <HighlightedLink
              href={makeHref("/#faq")}
              className="hidden font-medium text-sm text-white sm:inline"
              underline={false}
            >
              {t("header.faq")}
            </HighlightedLink>

            <HighlightedLink
              href={makeHref(session ? "/playlists" : "sign-in")}
              className="hidden font-medium text-sm text-white sm:inline"
              underline={false}
            >
              {t("header.playlists")}
            </HighlightedLink>

            <LanguageSwitcher />
            <AuthButton />
          </nav>
        </div>
      </header>
    </MaxWidthContainer>
  );
}
