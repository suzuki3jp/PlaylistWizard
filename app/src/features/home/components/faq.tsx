import type { WithT } from "i18next";
import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import { FadeInUpInScreenAnimation } from "@/components/animations/fade-in-up-in-screen";
import { CenteredLayout } from "@/components/layouts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { urls } from "@/constants";
import { Link } from "@/presentation/common/link";
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
              href={urls.GITHUB_REPO}
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
              href={`${urls.GITHUB_REPO}/issues/new`}
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
              href={`${urls.GITHUB_REPO}/issues/new?template=bug.yml`}
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
    <>
      {/** biome-ignore lint/correctness/useUniqueElementIds: Can't use useId hook in SSR */}
      <section className="w-full py-16 md:py-24" id="faq">
        <CenteredLayout direction="x" className="px-4 md:px-6">
          <div className="container">
            <FadeInUpInScreenAnimation>
              <CenteredLayout direction="x">
                <div className="mb-12 space-y-4 text-center">
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
              </CenteredLayout>
            </FadeInUpInScreenAnimation>

            <div className="mx-auto max-w-3xl space-y-8">
              {faqs.map((category, index) => (
                <FadeInUpInScreenAnimation
                  key={category.title}
                  delay={0.2 + index * 0.1}
                >
                  <h3 className="mb-4 font-bold text-2xl text-white">
                    {t(category.title)}
                  </h3>
                  <Accordion type="single" collapsible className="w-full">
                    {category.items.map((faq) => (
                      <FaqItem faq={faq} t={t} key={faq.question} />
                    ))}
                  </Accordion>
                </FadeInUpInScreenAnimation>
              ))}
            </div>
          </div>
        </CenteredLayout>
      </section>
    </>
  );
}

function FaqItem({ faq, t }: WithT & { faq: FaqItem }) {
  return (
    <AccordionItem
      key={faq.question}
      value={faq.answer}
      className="border-gray-800"
    >
      <AccordionTrigger className="w-full text-left text-lg text-white hover:no-underline data-[state=open]:text-pink-400">
        {t(faq.question)}
      </AccordionTrigger>
      <AccordionContent className="text-base text-gray-300 leading-relaxed">
        {faq.components ? (
          <Trans
            t={t}
            i18nKey={faq.answer}
            // @ts-expect-error
            components={faq.components}
          />
        ) : (
          t(faq.answer)
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
