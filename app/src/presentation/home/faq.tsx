import { FadeIn } from "@playlistwizard/shared-ui";
import type React from "react";
import type { ReactNode } from "react";
import { Trans } from "react-i18next/TransWithoutContext";

import type { WithT } from "@/@types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GITHUB_REPO } from "@/constants";
import { Link } from "@/presentation/common/link";
import { MaxWidthContainer } from "@/presentation/common/max-width-container";
import { SectionPyContainer } from "./section-py-container";

interface Question {
  question: string;
  answer: string;
  components?: Record<string, ReactNode>;
}

interface QuestionCategory {
  title: string;
  questions: Question[];
}

interface QuestionCategoryStructure {
  name: string;
  questions: (
    | string
    | { name: string; components: Record<string, ReactNode> }
  )[];
}

const linkStyleInQuestion = "text-pink-400 hover:text-pink-500 underline";

// The name of each question is converted to `faq.${name}.question` to use in t function parameter by convertCategoryStructureToCategory function
const questionStructures: QuestionCategoryStructure[] = [
  {
    name: "general",
    questions: [
      "what-is-pw",
      {
        name: "is-pw-free",
        components: {
          1: (
            <Link
              href={GITHUB_REPO}
              openInNewTab
              className={linkStyleInQuestion}
            />
          ),
        },
      },
    ],
  },
  {
    name: "functionality",
    questions: [
      "supported-platforms",
      "transfer-playlists",
      "will-my-playlists-be-changed",
    ],
  },
  {
    name: "privacy-and-security",
    questions: [
      {
        name: "is-my-data-safe",
        components: {
          1: (
            <Link href={"/terms-and-privacy"} className={linkStyleInQuestion} />
          ),
        },
      },
      "can-i-disconnect",
    ],
  },
  {
    name: "feature-req-and-bugs",
    questions: [
      {
        name: "feature-req",
        components: {
          1: (
            <Link
              href={`${GITHUB_REPO}/issues/new`}
              openInNewTab
              className={linkStyleInQuestion}
            />
          ),
        },
      },
      {
        name: "bug-report",
        components: {
          1: (
            <Link
              href={`${GITHUB_REPO}/issues/new?template=bug.yml`}
              openInNewTab
              className={linkStyleInQuestion}
            />
          ),
        },
      },
    ],
  },
] as const;

const questions: QuestionCategory[] = questionStructures.map(
  convertCategoryStructureToCategory,
);

function convertCategoryStructureToCategory(
  category: QuestionCategoryStructure,
): QuestionCategory {
  return {
    title: `faq.${category.name}.title`,
    questions: category.questions.map((question) => {
      if (typeof question === "string")
        return {
          question: `faq.${category.name}.${question}.question`,
          answer: `faq.${category.name}.${question}.answer`,
        };

      return {
        question: `faq.${category.name}.${question.name}.question`,
        answer: `faq.${category.name}.${question.name}.answer`,
        components: question.components,
      };
    }),
  };
}

export interface FaqSectionProps extends WithT {}

export function Faq({ t }: FaqSectionProps) {
  return (
    <MaxWidthContainer className="bg-gray-950" id="faq">
      <SectionPyContainer>
        <section>
          <FadeIn>
            <div className="mb-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-pink-500 px-3 py-1 text-sm text-white">
                  {t("faq.badge")}
                </div>
                <h2 className="font-bold text-3xl text-white tracking-tighter sm:text-5xl">
                  {t("faq.title")}
                </h2>
                <p className="max-w-[900px] text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  {t("faq.description")}
                </p>
              </div>
            </div>
          </FadeIn>

          <div className="mx-auto max-w-3xl space-y-8">
            {questions.map((category, categoryIndex) => (
              <FadeIn
                key={category.title}
                delay={0.1 * categoryIndex}
                className="space-y-4"
              >
                <h3 className="border-gray-800 border-b pb-2 font-bold text-white text-xl">
                  {t(category.title)}
                </h3>
                <Accordion type="single" collapsible className="space-y-2">
                  {category.questions.map((item, itemIndex) => (
                    <AccordionItem
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      key={itemIndex}
                      value={`${categoryIndex}-${itemIndex}`}
                      className="overflow-hidden rounded-lg border border-gray-800"
                    >
                      <AccordionTrigger className="px-4 py-3 text-left font-semibold text-white hover:bg-gray-800/50">
                        {t(item.question)}
                      </AccordionTrigger>
                      <AccordionContent className="bg-gray-800/30 px-4 py-3 text-gray-300">
                        {item.components ? (
                          <Trans
                            t={t}
                            i18nKey={item.answer}
                            // @ts-expect-error
                            components={item.components}
                          />
                        ) : (
                          t(item.answer)
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </FadeIn>
            ))}
          </div>
        </section>
      </SectionPyContainer>
    </MaxWidthContainer>
  );
}
