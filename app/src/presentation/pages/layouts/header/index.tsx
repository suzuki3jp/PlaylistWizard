import type { WithT } from "i18next";
import { getServerSession } from "next-auth";
import { HighlightedLink } from "@/components/highlighted-link";
import { Link } from "@/components/link";
import { makeLocalizedUrl } from "@/components/makeLocalizedUrl";
import { MaxWidthContainer } from "@/components/max-width-container";
import { PlaylistWizardLogo } from "@/components/playlistwizard-log";
import { UserMenu } from "@/features/user-menu/components/user-menu";
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

            <HighlightedLink
              href={makeHref(
                session ? "/structured-playlists/editor" : "sign-in",
              )}
              className="font-medium text-sm text-white sm:inline"
              underline={false}
            >
              {t("header.structured-playlists")}
            </HighlightedLink>

            <LanguageSwitcher />
            <AuthButton />
            <UserMenu />
          </nav>
        </div>
      </header>
    </MaxWidthContainer>
  );
}
