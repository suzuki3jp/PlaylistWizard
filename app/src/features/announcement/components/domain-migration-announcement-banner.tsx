"use client";
import dynamic from "next/dynamic";
import { Trans } from "react-i18next";
import { Link } from "@/components/link";
import { useT } from "@/presentation/hooks/t/client";

const AnnouncementBannerNoSSR = dynamic(() => import("./announcement-banner"), {
  ssr: false,
});

export function DomainMigrationAnnouncementBanner() {
  const { t } = useT("common");

  if (window.location.hostname === "playlistwizard.app") {
    return null;
  }

  return (
    <AnnouncementBannerNoSSR
      key="domain-migration"
      label={
        <Trans
          i18nKey="announcement.domain-migration"
          t={t}
          components={{
            1: <Link href="https://playlistwizard.app" className="underline" />,
          }}
        />
      }
    />
  );
}
