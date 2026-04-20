"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorView } from "@/features/error/view";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <ErrorView error={error} />;
}
