import { HelpCircle } from "lucide-react";

import type { WithT } from "@/@types";
import { FadeInUpAnimation } from "@/lib/components/animations/fade-in-up";
import { FadeInUpInScreenAnimation } from "@/lib/components/animations/fade-in-up-in-screen";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/presentation/shadcn/accordion";
import { Badge } from "./ui/badge";

const faqs = [
  {
    question: "PlaylistWizardは無料で使えますか？",
    answer:
      "はい、PlaylistWizardは基本機能を無料で提供しています。プレイリストの作成、編集、基本的な管理機能はすべて無料でご利用いただけます。",
  },
  {
    question: "YouTubeとSpotifyの両方に対応していますか？",
    answer:
      "はい、PlaylistWizardはYouTubeとSpotifyの両方のプレイリストに対応しています。各プラットフォームのAPIを使用して、安全かつ効率的にプレイリストを管理できます。",
  },
  {
    question: "データのセキュリティは大丈夫ですか？",
    answer:
      "PlaylistWizardは最高レベルのセキュリティを提供します。すべてのデータは暗号化され、OAuth 2.0を使用した安全な認証システムを採用しています。",
  },
  {
    question: "プレイリストの同期はどのように行われますか？",
    answer:
      "プレイリストの同期は、各プラットフォームの公式APIを通じて行われます。リアルタイムでの同期が可能で、変更は即座に反映されます。",
  },
  {
    question: "モバイルデバイスでも使用できますか？",
    answer:
      "はい、PlaylistWizardはレスポンシブデザインを採用しており、スマートフォンやタブレットでも快適にご利用いただけます。",
  },
  {
    question: "プレイリストのバックアップは可能ですか？",
    answer:
      "はい、PlaylistWizardではプレイリストの完全なバックアップ機能を提供しています。JSON形式でのエクスポート・インポートが可能です。",
  },
];

export function FaqSection({ t }: WithT) {
  return (
    <section className="flex w-full justify-center py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <FadeInUpInScreenAnimation className="mb-12 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-4">
            <Badge>
              <HelpCircle className="h-4 w-4" />
              {t("faq.badge")}
            </Badge>
            <h2 className="font-bold text-3xl text-white tracking-tight sm:text-4xl">
              疑問を
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                解決
              </span>
            </h2>
            <p className="max-w-[600px] text-gray-300 text-lg">
              {t("faq.description")}
            </p>
          </div>
        </FadeInUpInScreenAnimation>

        <div className="mx-auto max-w-3xl">
          <FadeInUpAnimation className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs.map((faq, index) => (
                <FadeInUpAnimation key={faq.question} delay={index * 0.05}>
                  <AccordionItem
                    value={`item-${index}`}
                    className="rounded-lg border border-gray-800 bg-gray-750 px-4 py-1 transition-all duration-200 hover:border-gray-600"
                  >
                    <AccordionTrigger className="py-4 text-left font-medium text-base text-white transition-colors hover:text-pink-400 hover:no-underline">
                      <span className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-4 text-gray-300 text-sm leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </FadeInUpAnimation>
              ))}
            </Accordion>
          </FadeInUpAnimation>
        </div>
      </div>
    </section>
  );
}
