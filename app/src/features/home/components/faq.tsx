import { FileQuestion, HelpCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Trans } from "react-i18next/TransWithoutContext";

import type { WithT } from "@/@types";
import { GITHUB_REPO } from "@/constants";
import { FadeInUpAnimation } from "@/lib/components/animations/fade-in-up";
import { FadeInUpInScreenAnimation } from "@/lib/components/animations/fade-in-up-in-screen";
import { Link } from "@/presentation/common/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/presentation/shadcn/accordion";
import { Badge } from "./ui/badge";

interface FaqCategory {
  title: string;
  items: FaqItem[];
}

interface FaqItem {
  question: string;
  answer: string;
  components?: Record<string, ReactNode>;
}

const linkStyleInQuestion = "text-pink-400 hover:text-pink-500 underline";

const faqs: FaqCategory[] = [
  {
    title: "faq.general.title",
    items: [
      {
        question: "faq.general.what-is-pw.question",
        answer: "faq.general.what-is-pw.answer",
      },
      {
        question: "faq.general.is-pw-free.question",
        answer: "faq.general.is-pw-free.answer",
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
    title: "faq.functionality.title",
    items: [
      {
        question: "faq.functionality.supported-platforms.question",
        answer: "faq.functionality.supported-platforms.answer",
      },
      {
        question: "faq.functionality.transfer-playlists.question",
        answer: "faq.functionality.transfer-playlists.answer",
      },
      {
        question: "faq.functionality.will-my-playlists-be-changed.question",
        answer: "faq.functionality.will-my-playlists-be-changed.answer",
      },
    ],
  },
  {
    title: "faq.privacy-and-security.title",
    items: [
      {
        question: "faq.privacy-and-security.is-my-data-safe.question",
        answer: "faq.privacy-and-security.is-my-data-safe.answer",
        components: {
          1: (
            <Link href={"/terms-and-privacy"} className={linkStyleInQuestion} />
          ),
        },
      },
      {
        question: "faq.privacy-and-security.can-i-disconnect.question",
        answer: "faq.privacy-and-security.can-i-disconnect.answer",
      },
    ],
  },
  {
    title: "faq.feature-req-and-bugs.title",
    items: [
      {
        question: "faq.feature-req-and-bugs.feature-req.question",
        answer: "faq.feature-req-and-bugs.feature-req.answer",
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
        question: "faq.feature-req-and-bugs.bug-report.question",
        answer: "faq.feature-req-and-bugs.bug-report.answer",
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
];

export function FaqSection({ t }: WithT) {
  return (
    <section className="flex w-full justify-center py-16 md:py-24" id="faq">
      <div className="container px-4 md:px-6">
        <FadeInUpInScreenAnimation className="mb-12 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-4">
            <Badge>
              <HelpCircle className="h-4 w-4" />
              {t("faq.badge")}
            </Badge>
            <h2 className="font-bold text-3xl text-white tracking-tight sm:text-4xl">
              <Trans
                t={t}
                i18nKey={"faq.title"}
                components={{
                  1: (
                    <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent" />
                  ),
                }}
              />
            </h2>
            <p className="max-w-[600px] text-gray-300 text-lg">
              {t("faq.description")}
            </p>
          </div>
        </FadeInUpInScreenAnimation>

        <div className="mx-auto max-w-3xl">
          <FadeInUpAnimation className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs.map((category, index) => (
                <div key={category.title} className="mb-8 last:mb-0">
                  <h3 className="mb-6 pl-3 font-bold text-2xl text-white">
                    {t(category.title)}
                  </h3>

                  {category.items.map((faq, faqIndex) => (
                    <FaqRow
                      faq={faq}
                      index={index * 10 + faqIndex}
                      key={faq.question}
                      t={t}
                    />
                  ))}
                </div>
              ))}
            </Accordion>
          </FadeInUpAnimation>
        </div>
      </div>
    </section>
  );
}

function FaqRow({ faq, index, t }: WithT<{ faq: FaqItem; index: number }>) {
  return (
    <FadeInUpAnimation key={faq.question} delay={index * 0.05}>
      <AccordionItem
        value={`item-${index}`}
        className="rounded-lg border border-gray-800 bg-gray-750 px-4 py-1 transition-all duration-200 hover:border-gray-600"
      >
        <AccordionTrigger className="py-4 text-left font-medium text-base text-white transition-colors hover:text-pink-400 hover:no-underline">
          <span className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
            {t(faq.question)}
          </span>
        </AccordionTrigger>
        <AccordionContent className="pt-1 pb-4 text-gray-300 text-sm leading-relaxed">
          {faq.components ? (
            // @ts-expect-error
            <Trans t={t} i18nKey={faq.answer} components={faq.components} />
          ) : (
            t(faq.answer)
          )}
        </AccordionContent>
      </AccordionItem>
    </FadeInUpAnimation>
  );
}
