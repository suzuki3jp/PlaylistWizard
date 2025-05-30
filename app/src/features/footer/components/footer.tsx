import { GitCommit, Github } from "lucide-react";
import Image from "next/image";
import { Trans } from "react-i18next/TransWithoutContext";

import type { WithT } from "@/@types";
import { Link } from "@/components/link";
import { GITHUB_REPO, VERSION } from "@/constants";
import { MaxWidthContainer } from "@/features/common/components/max-width-container";
import { getEnv } from "@/helpers/getEnv";
import Icon from "@/images/icon.png";

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
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-white text-xl">
              <div className="relative h-8 w-8">
                <Image
                  src={Icon}
                  width={32}
                  height={32}
                  alt="PlaylistWizard logo"
                />
              </div>
              PlaylistWizard
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t("hero.title")}
            </p>
            <div className="flex space-x-4">
              <Link
                href={GITHUB_REPO}
                openInNewTab
                className="text-gray-400 transition-colors hover:text-pink-400"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-white">
              {t("footer.product.title")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={GITHUB_REPO}
                  className="text-gray-400 text-sm transition-colors hover:text-white"
                >
                  {t("footer.product.playlistwizard")}
                </Link>
              </li>
              <li>
                <Link
                  href="https://my-steam.suzuki3.jp"
                  className="text-gray-400 text-sm transition-colors hover:text-white"
                >
                  {t("footer.product.my-steam")}
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.npmjs.com/package/@playlistwizard/youtube"
                  className="text-gray-400 text-sm transition-colors hover:text-white"
                >
                  {t("footer.product.youtube")}
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.npmjs.com/package/@playlistwizard/spotify"
                  className="text-gray-400 text-sm transition-colors hover:text-white"
                >
                  {t("footer.product.spotify")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-white">
              {t("footer.legal.title")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={makeLocalizedUrl("/terms")}
                  className="text-gray-400 text-sm transition-colors hover:text-white"
                >
                  {t("footer.legal.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href={makeLocalizedUrl("/privacy")}
                  className="text-gray-400 text-sm transition-colors hover:text-white"
                >
                  {t("footer.legal.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${GITHUB_REPO}/blob/main/LICENSE`}
                  className="text-gray-400 text-sm transition-colors hover:text-white"
                >
                  {t("footer.legal.license")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${GITHUB_REPO}/issues`}
                  className="text-gray-400 text-sm transition-colors hover:text-white"
                >
                  {t("footer.legal.contact")}
                </Link>
              </li>
            </ul>
          </div>
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
