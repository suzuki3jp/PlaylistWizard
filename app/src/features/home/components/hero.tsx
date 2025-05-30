import { FadeIn } from "@playlistwizard/shared-ui";
import Image from "next/image";

import type { WithT } from "@/@types";
import { GetStarted } from "@/components/get-started";
import { Button } from "@/components/ui/button";
import { GITHUB_REPO } from "@/constants";
import { SectionPyContainer } from "@/features/home/components/section-py-container";
import PlaylistsImage from "@/images/playlists.png";
import { Link } from "@/presentation/common/link";
import { MaxWidthContainer } from "@/presentation/common/max-width-container";

export type HeroProps = WithT & { lang: string };

export function Hero({ t, lang }: HeroProps) {
  return (
    <MaxWidthContainer className="min-h-screen">
      <SectionPyContainer>
        <section className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <FadeIn
            direction="left"
            className="flex flex-col justify-center"
            delay={0.1}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="font-bold text-3xl text-white tracking-tighter sm:text-5xl xl:text-6xl/none">
                  {t("hero.title")}
                </h1>
                <p className="max-w-[600px] text-gray-300 md:text-xl">
                  {t("hero.description")}
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <GetStarted lang={lang} />
                <Link href={GITHUB_REPO} openInNewTab>
                  <Button
                    variant="outline"
                    className="border-gray-700 text-black hover:bg-gray-800 hover:text-white"
                  >
                    {t("hero.view-source")}
                  </Button>
                </Link>
              </div>
            </div>
          </FadeIn>
          <FadeIn direction="right" delay={0.3}>
            <div className="mx-auto w-full max-w-[400px] lg:max-w-none">
              <div className="flex aspect-video w-full items-stretch justify-center overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-lg">
                <Image
                  src={PlaylistsImage}
                  alt="Playlists image"
                  style={{
                    height: "100%",
                    width: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                  className="h-full w-full max-w-none object-cover object-center"
                />
              </div>
            </div>
          </FadeIn>
        </section>
      </SectionPyContainer>
    </MaxWidthContainer>
  );
}
