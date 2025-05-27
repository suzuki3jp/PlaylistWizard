import Image from "next/image";
import Link from "next/link";

import type { WithT } from "@/@types";
import { MaxWidthContainer } from "@/features/common/components/max-width-container";
import { LanguageSwitcher } from "@/features/localization/components/language-switcher";
import { makeLocalizedUrl } from "@/helpers/makeLocalizedUrl";
import Icon from "@/images/icon.png";
import { AuthButton } from "../../../components/auth-button";

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
            <div className="relative h-8 w-8">
              <Image
                src={Icon}
                width={32}
                height={32}
                alt="PlaylistWizard logo"
              />
            </div>
            <span className="hidden sm:inline">PlaylistWizard</span>
          </div>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-6">
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
