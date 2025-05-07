import Image from "next/image";

import type { WithT } from "@/@types";
import { Button } from "@/components/ui/button";
import { GITHUB_REPO } from "@/constants";
import PlaylistsImage from "../../assets/playlists.png";
import { GetStarted } from "./get-started";
import { Link } from "./link";

export type HeroProps = WithT & { lang: string };

export function Hero({ t, lang }: HeroProps) {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gray-950 min-h-screen">
            <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
                    <div className="flex flex-col justify-center space-y-4">
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
                </div>
            </div>
        </section>
    );
}
