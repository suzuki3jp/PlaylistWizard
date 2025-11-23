import { ArrowRight } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";

import { FadeInUpInScreenAnimation } from "@/components/animations/fade-in-up-in-screen";
import { CenteredLayout } from "@/components/layouts";
import type { WithT } from "@/lib/types/t";
import { Badge } from "./ui/badge";
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
    <CenteredLayout
      direction="x"
      className="min-h-[calc(100vh-4rem)] bg-gray-900"
    >
      {
        // TODO: Set min width and overflow for comparison table to 630px
        // For mobile devices
      }
      {/** biome-ignore lint/correctness/useUniqueElementIds: Can't use useId hook in SSR */}
      <section className="px-4 py-16 md:px-6 md:py-24" id="features">
        <FadeInUpInScreenAnimation>
          <CenteredLayout direction="x">
            <div className="mb-16 space-y-4 text-center">
              <Badge>
                <ArrowRight className="h-4 w-4" />
                {t("comparison.badge")}
              </Badge>
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
          </CenteredLayout>
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
      </section>
    </CenteredLayout>
  );
}
