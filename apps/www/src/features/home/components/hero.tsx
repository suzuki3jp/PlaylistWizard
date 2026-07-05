import { Button } from "@playlistwizard/ui";
import type { WithT } from "i18next";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";
import { FadeInUpAnimation } from "@/components/animations/fade-in-up";
import { GetStartedButton } from "@/components/get-started-button";
import { urls } from "@/constants";

/**
 * Hero section of the home page.
 * Design: https://www.figma.com/design/HD7LaadIqYMEQJDgCajqwI/Home?node-id=9-47
 *
 * Which part of the headline gets the gradient differs by language (en: first
 * half / ja: second half), so the gradient span is applied through the <1> tag
 * embedded in the translation strings rather than in this component.
 * Both headline segments are inline-block so that on narrow screens the line
 * breaks only at the segment boundary, never inside a segment (Japanese text
 * would otherwise break between arbitrary characters).
 */
export function HeroSection({ t }: WithT) {
  return (
    <section className="relative z-10 container mx-auto px-4 py-24 md:px-6 md:py-32">
      <FadeInUpAnimation className="flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="space-y-3">
            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl xl:text-7xl">
              <Trans
                t={t}
                i18nKey="hero.title"
                components={{
                  1: (
                    <span className="inline-block bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent" />
                  ),
                  2: <span className="inline-block" />,
                }}
              />
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-gray-400 md:text-xl">
              {t("hero.description")}
            </p>
          </div>

          <FadeInUpAnimation
            delay={0.2}
            className="flex flex-wrap items-center justify-center gap-2.5"
          >
            <Button
              asChild
              className="bg-gray-800 font-semibold text-white hover:bg-gray-700"
            >
              <Link href={urls.GITHUB_REPO} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                {t("hero.github")}
              </Link>
            </Button>

            <GetStartedButton />
          </FadeInUpAnimation>
        </div>

        <FadeInUpAnimation delay={0.4} className="w-full max-w-6xl">
          {/*
            The demo is an autoplay/loop/muted video, not an animated GIF: a GIF of
            this length is ~30MB while the mp4 stays ~5MB at a higher resolution.
            The file is a web-optimized re-encode of /assets/copy-delete-demo.mp4.
            No captions track is needed because the video has no audio.
          */}
          {/*
            width/height and aspect-ratio reserve the video's box before its
            metadata loads; without them the element renders at zero height
            first and pushes the content below it down (layout shift).
          */}
          <video
            src="/assets/copy-delete-demo.mp4"
            autoPlay
            loop
            muted
            playsInline
            width={1832}
            height={1030}
            aria-label={t("hero.demo_label")}
            className="aspect-[1832/1030] w-full rounded-xl bg-gray-950 shadow-[0_0_11px_0_var(--color-gray-800)]"
          />
        </FadeInUpAnimation>
      </FadeInUpAnimation>
    </section>
  );
}
