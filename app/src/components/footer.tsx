import { GitCommit } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";

import type { WithT } from "@/@types";
import { Link } from "@/components/link";
import { GITHUB_REPO } from "@/constants";
import { getEnv } from "@/helpers/getEnv";

export interface FooterProps extends WithT {}

export async function Footer({ t }: FooterProps) {
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
    <footer className="w-full shrink-0 border-t border-gray-800 bg-gray-950 px-4 py-6 md:px-6">
      <div className="flex justify-end">
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-xs text-gray-400 hover:text-white hover:underline underline-offset-4"
            href="/terms-and-privacy"
          >
            {t("footer.terms")}
          </Link>
          <Link
            className="text-xs text-gray-400 hover:text-white hover:underline underline-offset-4"
            href={`${GITHUB_REPO}/issues`}
          >
            {t("footer.contact")}
          </Link>
        </nav>
      </div>

      <div className="my-4 border-t border-gray-800" />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-xs text-gray-400 text-center sm:text-left">
          © {new Date().getFullYear()} suzuki3jp All rights reserved.
        </p>

        <div className="flex items-center justify-center sm:justify-end gap-1 text-xs text-gray-400">
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
    </footer>
  );
}
