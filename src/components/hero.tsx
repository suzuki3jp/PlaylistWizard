import { ArrowRight } from "lucide-react";

import type { WithT } from "@/@types";
import { Button } from "@/components/ui/button";
import { GITHUB_REPO } from "@/constants";
import { Link } from "./link";

export type HeroProps = WithT;

export function Hero({ t }: HeroProps) {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gray-950">
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
                            <Button className="bg-pink-600 hover:bg-pink-700 text-white">
                                {t("hero.get-started")}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
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
                        <div className="w-full aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg">
                            <div className="flex items-center justify-center h-full">
                                <div className="w-[90%] h-[90%] bg-gray-900 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                        <div className="ml-4 text-xs text-white">
                                            PlaylistWizard
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
