import { ArrowRight, ExternalLink, Zap } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";

import { FadeInUpAnimation } from "@/lib/components/animations/fade-in-up";
import { CenteredLayout } from "@/lib/components/layouts";
import type { WithT } from "@/lib/types/t";
import { Badge } from "./ui/badge";
import { LinkButton } from "./ui/link-button";

export function HeroSection({ t }: WithT) {
  return (
    <CenteredLayout direction="xy" className="min-h-[calc(100vh-4rem)]">
      <section className="container relative z-10 px-4 md:px-6">
        <FadeInUpAnimation className="mx-auto flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-6">
            <FadeInUpAnimation delay={0.1}>
              <Badge>
                <Zap className="h-4 w-4" />
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
            <LinkButton
              href="/playlists"
              className="bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg hover:from-pink-700 hover:to-purple-700"
            >
              {t("hero.cta")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </LinkButton>

            <LinkButton
              variant="outline"
              href="https://github.com/suzuki3jp/playlistwizard"
              className="!border-[0.6666px] !border-gray-600 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <ExternalLink className="mr-2 h-5 w-5" />
              {t("hero.github")}
            </LinkButton>
          </FadeInUpAnimation>
        </FadeInUpAnimation>
      </section>
    </CenteredLayout>
  );
}
