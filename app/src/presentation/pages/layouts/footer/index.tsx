import { getEnv } from "@playlistwizard/env";
import type { WithT } from "i18next";
import { GitCommit, Github } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import { urls, VERSION } from "@/constants";
import { HighlightedLink } from "@/presentation/common/highlighted-link";
import { Link } from "@/presentation/common/link";
import { MaxWidthContainer } from "@/presentation/common/max-width-container";
import { PlaylistWizardLogo } from "@/presentation/common/playlistwizard-log";
import { FooterLinksCard } from "./footer-links-card";

export interface FooterProps extends WithT {
  lang: string;
}

export async function Footer({ t, lang }: FooterProps) {
  function makeLocalizedUrl(path: string) {
    return `/${lang}${path}`;
  }

  const isVercel = getEnv(["VERCEL"]).isOk();
  const commitInfo = getEnv([
    "VERCEL_GIT_REPO_OWNER",
    "VERCEL_GIT_REPO_SLUG",
    "VERCEL_GIT_COMMIT_SHA",
  ]);

  if (isVercel && commitInfo.isErr())
    throw new Error("Failed to get commit info on Vercel");

  // On Vercel, the commit info is available in the system environment variables
  // See: https://vercel.com/docs/environment-variables/system-environment-variables
  // On local, we will use a placeholder URL
  const commitShortHash = commitInfo
    .map(([_, __, sha]) => sha.slice(0, 7))
    .unwrapOr("Local");
  const commitUrl = commitInfo
    .map(
      ([repositoryOwner, repositoryName, sha]) =>
        `https://github.com/${repositoryOwner}/${repositoryName}/commit/${sha}`,
    )
    .unwrapOr("https://example.com");

  return (
    <footer className="border-gray-800 border-t bg-gray-950 px-4 py-7 md:px-6">
      <MaxWidthContainer>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-white text-xl">
              <div className="relative h-8 w-8">
                <PlaylistWizardLogo size={32} />
              </div>
              PlaylistWizard
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t("footer.description")}
            </p>
            <div className="flex space-x-4">
              <HighlightedLink
                href={urls.GITHUB_REPO}
                openInNewTab
                className="text-gray-400"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </HighlightedLink>
            </div>
          </div>

          <FooterLinksCard
            t={t}
            titleKey="footer.product.title"
            links={[
              {
                labelKey: "footer.product.playlistwizard",
                href: urls.GITHUB_REPO,
              },
              {
                labelKey: "footer.product.my-steam",
                href: "https://my-steam.suzuki3.jp",
              },
              {
                labelKey: "footer.product.youtube",
                href: "https://www.npmjs.com/package/@playlistwizard/youtube",
              },
              {
                labelKey: "footer.product.spotify",
                href: "https://www.npmjs.com/package/@playlistwizard/spotify",
              },
            ]}
          />

          <FooterLinksCard
            t={t}
            titleKey="footer.legal.title"
            links={[
              {
                labelKey: "footer.legal.terms",
                href: makeLocalizedUrl("/terms"),
              },
              {
                labelKey: "footer.legal.privacy",
                href: makeLocalizedUrl("/privacy"),
              },
              {
                labelKey: "footer.legal.license",
                href: `${urls.GITHUB_REPO}/blob/main/LICENSE`,
              },
              {
                labelKey: "footer.legal.contact",
                href: `${urls.GITHUB_REPO}/issues`,
              },
            ]}
          />

          <FooterLinksCard
            t={t}
            titleKey="footer.links.title"
            links={[
              {
                labelKey: "footer.links.github",
                href: urls.GITHUB_REPO,
              },
              {
                labelKey: "footer.links.changelog",
                href: `${urls.GITHUB_REPO}/blob/main/app/CHANGELOG.md`,
              },
            ]}
          />
        </div>
      </MaxWidthContainer>

      <div className="my-8 border-gray-800 border-t" />

      <MaxWidthContainer>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p className="text-gray-400 text-sm">{VERSION}</p>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} suzuki3jp. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <span>Made with ❤️ in Japan</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-gray-400 text-sm">
            <Trans
              i18nKey={"footer.deployed"}
              t={t}
              components={{
                1: (
                  <Link
                    href={commitUrl}
                    openInNewTab
                    className="inline-flex items-center gap-1 text-pink-400 hover:text-pink-300 hover:underline"
                  >
                    <GitCommit className="h-3 w-3" />
                    <span>{commitShortHash}</span>
                  </Link>
                ),
              }}
            />
          </div>
        </div>
      </MaxWidthContainer>
    </footer>
  );
}
