"use client";

import type { PropsWithChildren } from "react";
import { useT } from "@/presentation/hooks/t/client";

interface RouteLoadingProps {
  className?: string;
}

/**
 * Root element for route-level `loading.tsx` skeletons.
 *
 * Marks the skeleton as busy and announces a translated loading message so
 * that keyboard and screen reader users get feedback while the next page's
 * server data is still streaming. `loading.tsx` does not receive route params,
 * so the message is translated on the client from the current language.
 *
 * A route `loading.tsx` only covers work done inside its own segment. Data
 * fetched by parent layouts (e.g. `app/[lang]/layout.tsx`) and the proxy still
 * runs before this fallback can be shown on an uncached navigation.
 */
export function RouteLoading({
  className,
  children,
}: PropsWithChildren<RouteLoadingProps>) {
  const { t } = useT();

  return (
    <div aria-busy="true" className={className}>
      <span role="status" className="sr-only">
        {t("common.loading")}
      </span>
      {children}
    </div>
  );
}
