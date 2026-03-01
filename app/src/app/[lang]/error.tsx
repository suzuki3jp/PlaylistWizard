"use client";

import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { urls } from "@/constants";
import { UnauthorizedError } from "@/features/error";
import { ErrorView } from "@/features/error/view";
import { useLang } from "@/features/localization/atoms/lang";

export default function ({ error }: { error: Error & { digest?: string } }) {
  const router = useRouter();
  const [lang] = useLang();

  useEffect(() => {
    if (error instanceof UnauthorizedError) {
      router.push(urls.signOut(lang, error.redirectTo));
    } else {
      Sentry.captureException(error);
    }
  }, [error, lang, router]);

  return <ErrorView error={error} />;
}
