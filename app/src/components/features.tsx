import {
    Copy,
    GitMerge,
    Import,
    Layers,
    Search,
    Shuffle,
    Trash,
} from "lucide-react";
import type { ReactNode } from "react";

import type { WithT } from "@/@types";

interface FeaturesProps extends WithT {}

export function Features({ t }: FeaturesProps) {
    return (
        <section
            id="features"
            className="w-full py-12 md:py-24 lg:py-32 bg-gray-900 flex justify-center items-center"
        >
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-pink-500 px-3 py-1 text-sm text-white">
                            {t("features.badge")}
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white">
                            {t("features.title")}
                        </h2>
                        <p className="max-w-[900px] text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            {t("features.description")}
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
                    <FeatureCard
                        icon={
                            <div className="rounded-full bg-purple-500 p-3">
                                <Import className="h-6 w-6 text-white" />
                            </div>
                        }
                        title={t("features.import.title")}
                        description={t("features.import.description")}
                    />
                    <FeatureCard
                        icon={
                            <div className="rounded-full bg-pink-500 p-3">
                                <Copy className="h-6 w-6 text-white" />
                            </div>
                        }
                        title={t("features.copy.title")}
                        description={t("features.copy.description")}
                    />
                    <FeatureCard
                        icon={
                            <div className="rounded-full bg-purple-500 p-3">
                                <GitMerge className="h-6 w-6 text-white" />
                            </div>
                        }
                        title={t("features.merge.title")}
                        description={t("features.merge.description")}
                    />
                    <FeatureCard
                        icon={
                            <div className="rounded-full bg-pink-500 p-3">
                                <Shuffle className="h-6 w-6 text-white" />
                            </div>
                        }
                        title={t("features.shuffle.title")}
                        description={t("features.shuffle.description")}
                    />
                    <FeatureCard
                        icon={
                            <div className="rounded-full bg-purple-500 p-3">
                                <Trash className="h-6 w-6 text-white" />
                            </div>
                        }
                        title={t("features.delete.title")}
                        description={t("features.delete.description")}
                    />
                    <FeatureCard
                        icon={
                            <div className="rounded-full bg-pink-500 p-3">
                                <Search className="h-6 w-6 text-white" />
                            </div>
                        }
                        title={t("features.search.title")}
                        description={t("features.search.description")}
                    />
                    <FeatureCard
                        icon={
                            <div className="rounded-full bg-pink-500 p-3">
                                <Layers className="h-6 w-6 text-white" />
                            </div>
                        }
                        title={t("features.multi-platform.title")}
                        description={t("features.multi-platform.description")}
                    />
                </div>
            </div>
        </section>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 p-6 bg-gray-800 transition-all hover:border-pink-500">
            {icon}
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-sm text-gray-300 text-center">{description}</p>
        </div>
    );
}
