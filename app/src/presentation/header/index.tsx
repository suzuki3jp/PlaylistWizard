import type { WithT } from "@/@types";
import { LanguageSwitcher } from "@/features/localization/components/language-switcher";
import { makeLocalizedUrl } from "@/helpers/makeLocalizedUrl";
import { Link } from "@/presentation/common/link";
import { MaxWidthContainer } from "@/presentation/common/max-width-container";
import { PlaylistWizardLogo } from "@/presentation/common/playlistwizard-log";
import { AuthButton } from "../../components/auth-button";
import { HighlightedLink } from "../common/highlighted-link";

export type HeaderProps = WithT & { lang: string };

export function Header({ t, lang }: HeaderProps) {
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
            <Link
              href={makeHref("/#features")}
              className="hidden font-medium text-sm text-white hover:text-pink-400 sm:inline"
            >
              {t("header.features")}
            </Link>
            <Link
              href={makeHref("/#faq")}
              className="hidden font-medium text-sm text-white hover:text-pink-400 sm:inline"
            >
              {t("header.faq")}
            </Link>
            <LanguageSwitcher lang={lang} />
            <AuthButton lang={lang} />
          </nav>
        </div>
      </header>
    </MaxWidthContainer>
  );
}
