import { FadeIn, FadeInItem } from "@playlistwizard/shared-ui";
import {
  Copy,
  GitMerge,
  Import,
  Layers,
  type LucideProps,
  Search,
  Shuffle,
  Trash,
} from "lucide-react";
import type { ForwardRefExoticComponent, ReactNode } from "react";

import type { WithT } from "@/@types";
import { cn } from "@/presentation/common/cn";
import { MaxWidthContainer } from "@/presentation/common/max-width-container";
import { SectionPyContainer } from "./section-py-container";

interface Feature {
  title: string;
  description: string;
  icon: ReactNode;
}

interface FeatureMeta {
  name: string;
  icon: ReactNode;
}

function Icon({
  Image,
  color,
}: {
  Image: ForwardRefExoticComponent<LucideProps>;
  color: "purple" | "pink";
}) {
  return (
    <div
      className={cn(
        "rounded-full",
        "p-3",
        color === "purple" ? "bg-purple-500" : "bg-pink-500",
      )}
    >
      <Image className="h-6 w-6 text-white" />
    </div>
  );
}

// The name of each feature is converted to `features.${name}.title` to use in t function parameter by convertToFeature function
const features: Feature[] = [
  {
    name: "import",
    icon: <Icon Image={Import} color="purple" />,
  },
  {
    name: "copy",
    icon: <Icon Image={Copy} color="pink" />,
  },
  { name: "merge", icon: <Icon Image={GitMerge} color="purple" /> },
  { name: "shuffle", icon: <Icon Image={Shuffle} color="pink" /> },
  { name: "delete", icon: <Icon Image={Trash} color="purple" /> },
  { name: "search", icon: <Icon Image={Search} color="pink" /> },
  {
    name: "multi-platform",
    icon: <Icon Image={Layers} color="purple" />,
  },
].map(convertToFeature);

function convertToFeature({ name, icon }: FeatureMeta): Feature {
  return {
    title: `features.${name}.title`,
    description: `features.${name}.description`,
    icon,
  };
}

interface FeaturesProps extends WithT {}

export function Features({ t }: FeaturesProps) {
  return (
    <MaxWidthContainer className="bg-gray-900">
      <SectionPyContainer>
        <section id="features">
          <FadeIn className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-pink-500 px-3 py-1 text-sm text-white">
                {t("features.badge")}
              </div>
              <h2 className="font-bold text-3xl text-white tracking-tighter sm:text-5xl">
                {t("features.title")}
              </h2>
              <p className="max-w-[900px] text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {t("features.description")}
              </p>
            </div>
          </FadeIn>
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={t(feature.title)}
                description={t(feature.description)}
                index={index}
              />
            ))}
          </div>
        </section>
      </SectionPyContainer>
    </MaxWidthContainer>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  index,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <FadeInItem
      className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 bg-gray-800 p-6 transition-all hover:border-pink-500"
      delay={0.1 * index}
    >
      {icon}
      <h3 className="font-bold text-white text-xl">{title}</h3>
      <p className="text-center text-gray-300 text-sm">{description}</p>
    </FadeInItem>
  );
}
