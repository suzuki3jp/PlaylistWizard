"use client";
import Link, { type LinkProps } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { PropsWithChildren } from "react";
import { useCookies } from "react-cookie";
import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { urls } from "@/constants";
import { useLang } from "@/features/localization/atoms/lang";
import { COOKIE_NAME, supportedLangs } from "@/features/localization/i18n";
import { signOut, useSession } from "@/lib/auth-client";
import { useT } from "@/presentation/hooks/t/client";

export function DropdownMenuLinkItem({
  children,
  ...props
}: PropsWithChildren<LinkProps>) {
  return (
    <DropdownMenuItem asChild>
      <Link {...props}>{children}</Link>
    </DropdownMenuItem>
  );
}

export function SignInUserMenuItem() {
  const { t } = useT();
  const [lang] = useLang();

  return (
    <DropdownMenuLinkItem href={urls.signIn(lang, urls.playlists())}>
      {t("header.sign-in")}
    </DropdownMenuLinkItem>
  );
}

export function SignOutUserMenuItem() {
  const { t } = useT();
  const [lang] = useLang();

  function handleSignOut() {
    signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = `/${lang}/sign-in`;
        },
      },
    });
  }

  return (
    <DropdownMenuItem onClick={handleSignOut}>
      {t("header.sign-out")}
    </DropdownMenuItem>
  );
}

export function FeaturesUserMenuItem() {
  const [lang] = useLang();
  const { t } = useT();

  return (
    <DropdownMenuLinkItem href={urls.homeFeatures(lang)}>
      {t("header.features")}
    </DropdownMenuLinkItem>
  );
}

export function FaqUserMenuItem() {
  const [lang] = useLang();
  const { t } = useT();

  return (
    <DropdownMenuLinkItem href={urls.homeFaq(lang)}>
      {t("header.faq")}
    </DropdownMenuLinkItem>
  );
}

export function PlaylistsUserMenuItem() {
  const [lang] = useLang();
  const { t } = useT();
  const { data: session } = useSession();

  return (
    <DropdownMenuLinkItem
      href={session ? urls.playlists() : urls.signIn(lang, urls.playlists())}
    >
      {t("header.playlists")}
    </DropdownMenuLinkItem>
  );
}

export function StructuredPlaylistUserMenuItem() {
  const [lang] = useLang();
  const { t } = useT();
  const { data: session } = useSession();

  return (
    <DropdownMenuLinkItem
      href={
        session
          ? urls.structuredPlaylistsEditor(lang)
          : urls.signIn(lang, urls.structuredPlaylistsEditor(lang))
      }
    >
      {t("header.structured-playlists")}
    </DropdownMenuLinkItem>
  );
}

export function SettingsUserMenuItem() {
  const [lang] = useLang();
  const { t } = useT();

  return (
    <DropdownMenuLinkItem href={urls.settings(lang)}>
      {t("header.settings")}
    </DropdownMenuLinkItem>
  );
}

export function GitHubUserMenuItem() {
  const { t } = useT();

  return (
    <DropdownMenuLinkItem href={urls.GITHUB_REPO}>
      {t("footer.links.github")}
    </DropdownMenuLinkItem>
  );
}

export function ChangelogUserMenuItem() {
  const { t } = useT();

  return (
    <DropdownMenuLinkItem
      href={`${urls.GITHUB_REPO}/blob/main/app/CHANGELOG.md`}
    >
      {t("footer.links.changelog")}
    </DropdownMenuLinkItem>
  );
}

export function LanguageRadioUserMenuItem() {
  const [lang, setLang] = useLang();
  const { t } = useT();
  const [_, setCookie] = useCookies();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const langs: Record<string, string> = {};
  for (const lang of supportedLangs) {
    langs[lang] = t(`header.language.${lang}`);
  }

  function handleChange(value: string) {
    setLang(value);
    setCookie(COOKIE_NAME, value);

    const pathParts = pathname.split("/");
    pathParts[1] = value;

    window.location.href = `${pathParts.join("/")}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {t(`header.language.${lang}`)}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value={lang} onValueChange={handleChange}>
            {Object.entries(langs).map(([key, value]) => (
              <DropdownMenuRadioItem key={key} value={key}>
                {value}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
