import { ArrowRight, Check, X } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";

import { FadeInUpInScreenAnimation } from "@/lib/components/animations/fade-in-up-in-screen";
import type { WithT } from "@/lib/types/t";
import { ComparisonRowAnimation } from "./ui/comparison-row-animation";
import {
  ComparisonRow,
  ComparisonTable,
  ComparisonTableHeader,
} from "./ui/comparison-table";

export interface ComparisonItem {
  title: string;
  official: boolean;
  thirdParty: boolean;
  playlistWizard: boolean;
}

const comparisons: ComparisonItem[] = [
  {
    title: "comparison.playlist_management",
    official: false,
    thirdParty: true,
    playlistWizard: true,
  },
  {
    title: "comparison.import",
    official: false,
    thirdParty: false,
    playlistWizard: true,
  },
  {
    title: "comparison.structured_playlists",
    official: false,
    thirdParty: false,
    playlistWizard: true,
  },
  {
    title: "comparison.search",
    official: false,
    thirdParty: true,
    playlistWizard: true,
  },
];

export function ComparisonSection({ t }: WithT) {
  function convertKeyToTranslation(key: string) {
    return t(key);
  }
  return (
    <section className="flex w-full justify-center bg-gray-900 py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <FadeInUpInScreenAnimation className="mb-16 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-pink-300 text-sm">
              <ArrowRight className="h-4 w-4" />
              {t("comparison.badge")}
            </div>
            <h2 className="font-bold text-3xl text-white tracking-tight sm:text-4xl">
              <Trans
                i18nKey="comparison.title"
                t={t}
                components={{
                  1: (
                    <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent" />
                  ),
                }}
              />
            </h2>
            <p className="max-w-[600px] text-gray-300 text-lg">
              {t("comparison.description")}
            </p>
          </div>
        </FadeInUpInScreenAnimation>

        <ComparisonTable>
          <ComparisonTableHeader t={t} />
          {comparisons
            .map((item) => {
              return {
                ...item,
                title: convertKeyToTranslation(item.title),
              };
            })
            .map((item, index) => (
              <ComparisonRow key={item.title} item={item} index={index} />
            ))}
        </ComparisonTable>
      </div>
    </section>
  );
}
