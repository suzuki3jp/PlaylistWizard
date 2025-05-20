import { FadeIn } from "@playlistwizard/shared-ui";
import Image from "next/image";

import type { WithT } from "@/@types";
import { GetStarted } from "@/components/get-started";
import { Link } from "@/components/link";
import { Button } from "@/components/ui/button";
import { GITHUB_REPO } from "@/constants";
import { MaxWidthContainer } from "@/features/common/components/max-width-container";
import PlaylistsImage from "@/images/playlists.png";

export type HeroProps = WithT & { lang: string };

export function Hero({ t, lang }: HeroProps) {
  return (
    <MaxWidthContainer className="min-h-screen">
      <section className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
        <FadeIn
          direction="left"
          className="flex flex-col justify-center"
          delay={0.1}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-white">
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
                  className="text-black border-gray-700 hover:bg-gray-800 hover:text-white"
                >
                  {t("hero.view-source")}
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>
        <FadeIn direction="right" delay={0.3}>
          <div className="mx-auto w-full max-w-[400px] lg:max-w-none">
            <div className="w-full aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg flex items-stretch justify-center">
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
    </MaxWidthContainer>
  );
}
