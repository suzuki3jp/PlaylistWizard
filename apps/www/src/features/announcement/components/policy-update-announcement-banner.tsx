"use client";
import { Trans } from "react-i18next";
import { Link } from "@/components/link";
import { makeLocalizedUrl } from "@/components/makeLocalizedUrl";
import { useLang } from "@/features/localization/atoms/lang";
import { useT } from "@/presentation/hooks/t/client";
import { POLICY_UPDATE_ANNOUNCEMENT_KEY } from "../constants";
import AnnouncementBanner from "./announcement-banner";

export function PolicyUpdateAnnouncementBanner() {
  const { t } = useT("common");
  const [lang] = useLang();

  return (
    <AnnouncementBanner
      annoucementKey={POLICY_UPDATE_ANNOUNCEMENT_KEY}
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
