import { Trans } from "react-i18next/TransWithoutContext";

import type { SSRProps } from "@/@types";
import { Link } from "@/components/link";
import { Text } from "@/components/text";
import {
  GOOGLE_CONNECTIONS,
  GOOGLE_PRIVACY_POLICY,
  SPOTIFY_CONNECTIONS,
  SPOTIFY_PRIVACY_POLICY,
  SPOTIFY_TOS,
  YOUTUBE_TOS,
} from "@/constants";
import { useServerT } from "@/features/localization/hooks/server";

export default async function TermsAndPrivacy({ params }: SSRProps) {
  const { lang } = await params;
  const { t } = await useServerT(lang, "terms");

  return (
    <main>
      <section className="text-white">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl py-12 space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
            <p className="text-muted-foreground">{t("effective-date")}</p>
          </div>

          <p className="text-muted-foreground">{t("definition")}</p>

          <div className="grid gap-2">
            <h3 className="text-2xl font-bold tracking-tight">
              {`1. ${t("acceptance-of-terms.title")}`}
            </h3>
            <Text>
              <Trans
                t={t}
                i18nKey="acceptance-of-terms.content"
                components={{
                  1: <Link href={YOUTUBE_TOS} underline />,
                  2: <Link href={GOOGLE_PRIVACY_POLICY} underline />,
                  3: <Link href={SPOTIFY_TOS} underline />,
                  4: <Link href={SPOTIFY_PRIVACY_POLICY} underline />,
                }}
              />
            </Text>
          </div>

          <div className="grid gap-2">
            <h3 className="text-2xl font-bold tracking-tight">
              {`2. ${t("limitation-of-liability.title")}`}
            </h3>
            <Text>{t("limitation-of-liability.content")}</Text>
          </div>

          <div className="grid gap-2">
            <h3 className="text-2xl font-bold tracking-tight">
              {`3. ${t("music-service-apis.title")}`}
            </h3>
            <h4 className="text-1xl font-bold tracking-tight">
              {`3.1 ${t("music-service-apis.youtube-data-api.title")}`}
            </h4>
            <Text>{t("music-service-apis.youtube-data-api.content")}</Text>
            <h4 className="text-1xl font-bold tracking-tight">
              {`3.2 ${t("music-service-apis.spotify-api.title")}`}
            </h4>
            <Text>{t("music-service-apis.spotify-api.content")}</Text>
          </div>

          <div className="grid gap-2">
            <h3 className="text-2xl font-bold tracking-tight">
              {`4. ${t("how-to-revoke.title")}`}
            </h3>
            <h4 className="text-1xl font-bold tracking-tight">
              {`4.1 ${t("how-to-revoke.youtube.title")}`}
            </h4>
            <Text>
              <Trans
                t={t}
                i18nKey="how-to-revoke.youtube.content"
                components={{
                  1: <Link href={GOOGLE_CONNECTIONS} underline />,
                }}
              />
            </Text>
            <h4 className="text-1xl font-bold tracking-tight">
              {`4.2 ${t("how-to-revoke.spotify.title")}`}
            </h4>
            <Text>
              <Trans
                t={t}
                i18nKey="how-to-revoke.spotify.content"
                components={{
                  1: <Link href={SPOTIFY_CONNECTIONS} underline />,
                }}
              />
            </Text>
          </div>

          <div className="grid gap-2">
            <h3 className="text-2xl font-bold tracking-tight">
              {`5. ${t("security-of-data.title")}`}
            </h3>
            <Text>{t("security-of-data.content")}</Text>
          </div>

          <div className="grid gap-2">
            <h3 className="text-2xl font-bold tracking-tight">
              {`6. ${t("disclosures-of-data.title")}`}
            </h3>
            <Text>{t("disclosures-of-data.content")}</Text>
          </div>

          <div className="grid gap-2">
            <h3 className="text-2xl font-bold tracking-tight">
              {`7. ${t("google-analytics.title")}`}
            </h3>
            <Text>{t("google-analytics.content")}</Text>
          </div>

          <div className="grid gap-2">
            <h3 className="text-2xl font-bold tracking-tight">
              {`8. ${t("update-and-changes.title")}`}
            </h3>
            <Text>{t("update-and-changes.content")}</Text>
          </div>

          <div className="grid gap-2">
            <h3 className="text-2xl font-bold tracking-tight">
              {`9. ${t("governing-law.title")}`}
            </h3>
            <Text>{t("governing-law.content")}</Text>
          </div>
        </div>
      </section>
    </main>
  );
}
