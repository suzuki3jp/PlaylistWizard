"use client";
import dynamic from "next/dynamic";
import { Trans } from "react-i18next";
import { Link } from "@/components/link";
import { makeLocalizedUrl } from "@/components/makeLocalizedUrl";
import { useLang } from "@/features/localization/atoms/lang";
import { useT } from "@/presentation/hooks/t/client";

const AnnouncementBannerNoSSR = dynamic(() => import("./announcement-banner"), {
  ssr: false,
});

export function PolicyUpdateAnnouncementBanner() {
  const { t } = useT("common");
  const [lang] = useLang();

  return (
    <AnnouncementBannerNoSSR
      annoucementKey="policy-update-2026-02-21"
      label={
        <Trans
          i18nKey="announcement.policy-update"
          t={t}
          components={{
            1: (
              <Link
                href={makeLocalizedUrl(lang, "/terms")}
                className="underline"
              />
            ),
            2: (
              <Link
                href={makeLocalizedUrl(lang, "/privacy")}
                className="underline"
              />
            ),
          }}
        />
      }
    />
  );
}
