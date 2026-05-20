import { Badge, Button } from "@playlistwizard/ui";
import type { WithT } from "i18next";
import { ArrowRight, ExternalLink, Zap } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";
import { FadeInUpAnimation } from "@/components/animations/fade-in-up";
import { CenteredLayout } from "@/components/layouts";
import { urls } from "@/constants";

export function HeroSection({ t }: WithT) {
  return (
    <CenteredLayout direction="xy" className="min-h-[calc(100vh-4rem)]">
      <section className="container relative z-10 px-4 md:px-6">
        <FadeInUpAnimation className="mx-auto flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-6">
            <FadeInUpAnimation delay={0.1}>
              <Badge variant="marketing">
                <Zap className="size-4" />
                {t("hero.badge")}
              </Badge>
            </FadeInUpAnimation>

            <h1 className="font-bold text-5xl text-white tracking-tight sm:text-6xl xl:text-7xl 2xl:text-8xl">
              <Trans
                t={t}
                i18nKey="hero.title"
                components={{
                  1: (
                    <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent" />
                  ),
                  2: <br />,
                }}
              />
            </h1>

            <p className="mx-auto max-w-3xl text-gray-300 text-xl leading-relaxed 2xl:text-2xl">
              {t("hero.description")}
            </p>
          </div>

          <FadeInUpAnimation
            delay={0.3}
            className="flex flex-col gap-4 sm:flex-row sm:gap-6"
          >
            <Button
              asChild
              variant="cta"
              size="lg"
              className="px-8 py-4 font-semibold text-lg"
            >
              <Link href="/playlists">
                {t("hero.cta")}
                <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="px-8 py-4 font-semibold text-lg"
            >
              <Link href={urls.GITHUB_REPO} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 size-5" />
                {t("hero.github")}
              </Link>
            </Button>
          </FadeInUpAnimation>
        </FadeInUpAnimation>
      </section>
    </CenteredLayout>
  );
}
