import {
    Copy,
    GitMerge,
    Import,
    Layers,
    Search,
    Shuffle,
    Trash,
} from "lucide-react";

import type { WithT } from "@/@types";

interface FeaturesProps extends WithT {}

export function Features({ t }: FeaturesProps) {
    return (
        <section
            id="features"
            className="w-full py-12 md:py-24 lg:py-32 bg-gray-900"
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
                    <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 p-6 bg-gray-800 transition-all hover:border-pink-500">
                        <div className="rounded-full bg-purple-500 p-3">
                            <Import className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">
                            {t("features.import.title")}
                        </h3>
                        <p className="text-sm text-gray-300 text-center">
                            {t("features.import.description")}
                        </p>
                    </div>
                    <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 p-6 bg-gray-800 transition-all hover:border-pink-500">
                        <div className="rounded-full bg-pink-500 p-3">
                            <Copy className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">
                            {t("features.copy.title")}
                        </h3>
                        <p className="text-sm text-gray-300 text-center">
                            {t("features.copy.description")}
                        </p>
                    </div>
                    <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 p-6 bg-gray-800 transition-all hover:border-pink-500">
                        <div className="rounded-full bg-purple-500 p-3">
                            <GitMerge className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">
                            {t("features.merge.title")}
                        </h3>
                        <p className="text-sm text-gray-300 text-center">
                            {t("features.merge.description")}
                        </p>
                    </div>
                    <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 p-6 bg-gray-800 transition-all hover:border-pink-500">
                        <div className="rounded-full bg-pink-500 p-3">
                            <Shuffle className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">
                            {t("features.shuffle.title")}
                        </h3>
                        <p className="text-sm text-gray-300 text-center">
                            {t("features.shuffle.description")}
                        </p>
                    </div>
                    <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 p-6 bg-gray-800 transition-all hover:border-pink-500">
                        <div className="rounded-full bg-purple-500 p-3">
                            <Trash className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">
                            {t("features.delete.title")}
                        </h3>
                        <p className="text-sm text-gray-300 text-center">
                            {t("features.delete.description")}
                        </p>
                    </div>
                    <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 p-6 bg-gray-800 transition-all hover:border-pink-500">
                        <div className="rounded-full bg-pink-500 p-3">
                            <Search className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">
                            {t("features.search.title")}
                        </h3>
                        <p className="text-sm text-gray-300 text-center">
                            {t("features.search.description")}
                        </p>
                    </div>
                    <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 p-6 bg-gray-800 transition-all hover:border-pink-500">
                        <div className="rounded-full bg-pink-500 p-3">
                            <Layers className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">
                            {t("features.multi-platform.title")}
                        </h3>
                        <p className="text-sm text-gray-300 text-center">
                            {t("features.multi-platform.description")}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
