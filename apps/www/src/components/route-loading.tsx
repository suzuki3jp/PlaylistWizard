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
 * so the message is translated on the client from the current language. The
 * live region sits outside the busy container because assistive technology
 * may hold back announcements from inside an `aria-busy` subtree.
 *
 * A route `loading.tsx` only covers work done inside its own segment. The
 * proxy runs before this fallback can be shown on every request for the
 * route. Parent layouts (e.g. `app/[lang]/layout.tsx`) also run first when
 * they are part of the render: on initial load, or when navigating into a
 * layout that is not already mounted. Layouts shared with the previous page
 * are not re-rendered on client navigation.
 */
export function RouteLoading({
  className,
  children,
}: PropsWithChildren<RouteLoadingProps>) {
  const { t } = useT();

  return (
    <>
      <span role="status" className="sr-only">
        {t("common.loading")}
      </span>
      <div aria-busy="true" className={className}>
        {children}
      </div>
    </>
  );
}
