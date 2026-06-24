"use client";
import { AlertTriangle } from "lucide-react";
import { Trans } from "react-i18next";
import { Link } from "@/components/link";
import { urls } from "@/constants";
import { useT } from "@/presentation/hooks/t/client";

export function ErrorView({ error }: { error: Error & { digest?: string } }) {
  const { t } = useT("error");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="mx-auto max-w-md space-y-6 px-4 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <p className="text-gray-400">{t("description")}</p>
        </div>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-left">
            <h3 className="mb-2 text-sm font-medium text-red-400">
              エラー詳細:
            </h3>
            <pre className="overflow-auto text-xs text-gray-300">
              {error.message}
            </pre>
            {error.digest && (
              <p className="mt-2 text-xs text-gray-500">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Support Info */}
        <div className="border-t border-gray-800 pt-8">
          <p className="text-sm text-gray-500">
            <Trans
              t={t}
              i18nKey="support"
              components={{
                1: (
                  <Link
                    href={urls.GITHUB_ISSUES}
                    className="ml-1 text-pink-400 hover:text-pink-300"
                  />
                ),
              }}
            />
          </p>
        </div>
      </div>
    </div>
  );
}
