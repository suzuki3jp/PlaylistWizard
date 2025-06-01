import { Trans } from "react-i18next/TransWithoutContext";

import {
  GOOGLE_CONNECTIONS,
  GOOGLE_PRIVACY_POLICY,
  SPOTIFY_CONNECTIONS,
  SPOTIFY_PRIVACY_POLICY,
  SPOTIFY_TOS,
  YOUTUBE_TOS,
} from "@/constants";
import { HighlightedLink } from "@/presentation/common/highlighted-link";
import { MaxWidthContainer } from "@/presentation/common/max-width-container";
import {
  Section,
  SectionSecondaryTitle,
  SectionTitle,
} from "@/presentation/common/section";
import { Text, Title } from "@/presentation/common/typography";
import { useServerT } from "@/presentation/hooks/t/server";

interface TermsOfServiceProps {
  lang: string;
}

const TermsKeys = {
  title: "title",
  effectiveDate: "effective-date",
  intro: "intro",
  privacyPolicy: "privacy-policy",
  acceptance: {
    title: "acceptance.title",
    content1: "acceptance.content-1",
    content2: "acceptance.content-2",
    youtubeTerms: "acceptance.youtube-terms",
    googlePrivacy: "acceptance.google-privacy",
    spotifyTerms: "acceptance.spotify-terms",
    spotifyPrivacy: "acceptance.spotify-privacy",
  },
  limitation: {
    title: "limitation.title",
    content: "limitation.content",
  },
  apis: {
    title: "apis.title",
    youtube: {
      title: "apis.youtube.title",
      content: "apis.youtube.content",
    },
    spotify: {
      title: "apis.spotify.title",
      content: "apis.spotify.content",
    },
  },
  revoke: {
    title: "revoke.title",
    youtube: {
      title: "revoke.youtube.title",
      content: "revoke.youtube.content",
    },
    spotify: {
      title: "revoke.spotify.title",
      content: "revoke.spotify.content",
    },
  },
  update: {
    title: "update.title",
    content: "update.content",
  },
  governingLaw: {
    title: "governing-law.title",
    content: "governing-law.content",
  },
};

export async function TermsOfService({ lang }: TermsOfServiceProps) {
  const { t } = await useServerT(lang, "terms");

  function makeHref(path: string) {
    return `/${lang}${path}`;
  }

  return (
    <MaxWidthContainer className="min-h-screen">
      <main className="container py-8">
        <div className="space-y-4">
          <Title>{t(TermsKeys.title)}</Title>
          <p className="text-gray-400">{t(TermsKeys.effectiveDate)}</p>

          <div className="border-gray-800 border-b pb-4">
            <Text>{t(TermsKeys.intro)}</Text>
            <Text>
              <Trans
                t={t}
                i18nKey={TermsKeys.privacyPolicy}
                components={{
                  1: <HighlightedLink href={makeHref("/privacy")} />,
                }}
              />
            </Text>
          </div>

          <div className="space-y-8">
            <Section>
              <SectionTitle>{t(TermsKeys.acceptance.title)}</SectionTitle>
              <div className="space-y-3 text-gray-300 leading-relaxed">
                <p>{t(TermsKeys.acceptance.content1)}</p>
                <ul className="ml-4 list-inside list-disc space-y-2">
                  <li>
                    <Trans
                      t={t}
                      i18nKey={TermsKeys.acceptance.youtubeTerms}
                      components={{
                        1: <HighlightedLink href={YOUTUBE_TOS} />,
                      }}
                    />
                  </li>
                  <li>
                    <Trans
                      t={t}
                      i18nKey={TermsKeys.acceptance.googlePrivacy}
                      components={{
                        1: <HighlightedLink href={GOOGLE_PRIVACY_POLICY} />,
                      }}
                    />
                  </li>
                  <li>
                    <Trans
                      t={t}
                      i18nKey={TermsKeys.acceptance.spotifyTerms}
                      components={{
                        1: <HighlightedLink href={SPOTIFY_TOS} />,
                      }}
                    />
                  </li>
                  <li>
                    <Trans
                      t={t}
                      i18nKey={TermsKeys.acceptance.spotifyPrivacy}
                      components={{
                        1: <HighlightedLink href={SPOTIFY_PRIVACY_POLICY} />,
                      }}
                    />
                  </li>
                </ul>
                <p>{t(TermsKeys.acceptance.content2)}</p>
              </div>
            </Section>

            <Section>
              <SectionTitle>{t(TermsKeys.limitation.title)}</SectionTitle>
              <Text>{t(TermsKeys.limitation.content)}</Text>
            </Section>

            <Section>
              <SectionTitle>{t(TermsKeys.apis.title)}</SectionTitle>

              <div className="space-y-4">
                <SectionSecondaryTitle>
                  {t(TermsKeys.apis.youtube.title)}
                </SectionSecondaryTitle>
                <Text>{t(TermsKeys.apis.youtube.content)}</Text>

                <SectionSecondaryTitle>
                  {t(TermsKeys.apis.spotify.title)}
                </SectionSecondaryTitle>
                <Text>{t(TermsKeys.apis.spotify.content)}</Text>
              </div>
            </Section>

            <Section>
              <SectionTitle>{t(TermsKeys.revoke.title)}</SectionTitle>

              <div className="space-y-4">
                <SectionSecondaryTitle>
                  {t(TermsKeys.revoke.youtube.title)}
                </SectionSecondaryTitle>
                <Text>
                  <Trans
                    t={t}
                    i18nKey={TermsKeys.revoke.youtube.content}
                    components={{
                      1: <HighlightedLink href={GOOGLE_CONNECTIONS} />,
                    }}
                  />
                </Text>

                <SectionSecondaryTitle>
                  {t(TermsKeys.revoke.spotify.title)}
                </SectionSecondaryTitle>
                <Text>
                  {
                    <Trans
                      t={t}
                      i18nKey={TermsKeys.revoke.spotify.content}
                      components={{
                        1: <HighlightedLink href={SPOTIFY_CONNECTIONS} />,
                      }}
                    />
                  }
                </Text>
              </div>
            </Section>

            <Section>
              <SectionTitle>{t(TermsKeys.update.title)}</SectionTitle>
              <Text>{t(TermsKeys.update.content)}</Text>
            </Section>

            <Section>
              <SectionTitle>{t(TermsKeys.governingLaw.title)}</SectionTitle>
              <Text>{t(TermsKeys.governingLaw.content)}</Text>
            </Section>
          </div>
        </div>
      </main>
    </MaxWidthContainer>
  );
}
