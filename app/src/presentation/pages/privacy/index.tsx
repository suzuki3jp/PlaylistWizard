import { Trans } from "react-i18next/TransWithoutContext";

import {
  GOOGLE_ANALYTICS_PRIVACY_POLICY,
  GOOGLE_ANALYTICS_TOS,
} from "@/constants";
import { HighlightedLink } from "@/presentation/common/highlighted-link";
import { MaxWidthContainer } from "@/presentation/common/max-width-container";
import { Section, SectionTitle } from "@/presentation/common/section";
import { Text, Title } from "@/presentation/common/typography";
import { useServerT } from "@/presentation/hooks/t/server";

interface PrivacyPolicyProps {
  lang: string;
}

const PrivacyKeys = {
  title: "title",
  effectiveDate: "effective-date",
  intro: "intro",
  security: { title: "security.title", content: "security.content" },
  disclosure: {
    title: "disclosure.title",
    content: "disclosure.content",
  },
  googleAnalytics: {
    title: "google-analytics.title",
    content1: "google-analytics.content-1",
    pagesVisited: "google-analytics.pages-visited",
    timeSpent: "google-analytics.time-spent",
    referringSites: "google-analytics.referring-sites",
    content2: "google-analytics.content-2",
    content3: "google-analytics.content-3",
    terms: "google-analytics.google-analytics-terms",
    privacy: "google-analytics.google-privacy",
  },
};

export async function PrivacyPolicyPage({ lang }: PrivacyPolicyProps) {
  const { t } = await useServerT(lang, "privacy");

  return (
    <MaxWidthContainer className="min-h-screen">
      <main className="container space-y-8 py-8">
        <div className="space-y-4">
          <Title>{t(PrivacyKeys.title)}</Title>
          <p className="text-gray-400">{t(PrivacyKeys.effectiveDate)}</p>

          <div className="border-gray-800 border-b pb-4">
            <Text>{t(PrivacyKeys.intro)}</Text>
          </div>
        </div>

        <div className="space-y-8">
          <Section>
            <SectionTitle>{t(PrivacyKeys.security.title)}</SectionTitle>
            <Text>{t(PrivacyKeys.security.content)}</Text>
          </Section>

          <Section>
            <SectionTitle>{t(PrivacyKeys.disclosure.title)}</SectionTitle>
            <Text>{t(PrivacyKeys.disclosure.content)}</Text>
          </Section>

          <Section>
            <SectionTitle>{t(PrivacyKeys.googleAnalytics.title)}</SectionTitle>
            <Text>{t(PrivacyKeys.googleAnalytics.content1)}</Text>

            <ul className="ml-4 list-inside list-disc space-y-2 text-gray-300 leading-relaxed">
              <li>
                <Text className="inline">
                  {t(PrivacyKeys.googleAnalytics.pagesVisited)}
                </Text>
              </li>
              <li>
                <Text className="inline">
                  {t(PrivacyKeys.googleAnalytics.timeSpent)}
                </Text>
              </li>
              <li>
                <Text className="inline">
                  {t(PrivacyKeys.googleAnalytics.referringSites)}
                </Text>
              </li>
            </ul>
            <Text>{t(PrivacyKeys.googleAnalytics.content2)}</Text>
            <Text>{t(PrivacyKeys.googleAnalytics.content3)}</Text>
            <ul className="ml-4 list-inside list-disc space-y-2 text-gray-300 leading-relaxed">
              <li>
                <Trans
                  t={t}
                  i18nKey={PrivacyKeys.googleAnalytics.terms}
                  components={{
                    1: <HighlightedLink href={GOOGLE_ANALYTICS_TOS} />,
                  }}
                />
              </li>
              <li>
                <Trans
                  t={t}
                  i18nKey={PrivacyKeys.googleAnalytics.privacy}
                  components={{
                    1: (
                      <HighlightedLink href={GOOGLE_ANALYTICS_PRIVACY_POLICY} />
                    ),
                  }}
                />
              </li>
            </ul>
          </Section>
        </div>
      </main>
    </MaxWidthContainer>
  );
}
