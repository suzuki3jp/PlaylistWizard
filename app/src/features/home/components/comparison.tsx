import { ArrowRight, Check, X } from "lucide-react";

import { FadeInUpInScreenAnimation } from "@/lib/components/animations/fade-in-up-in-screen";
import type { WithT } from "@/lib/types/t";
import { ComparisonRowAnimation } from "./ui/comparison-row-animation";
import { ComparisonTable, ComparisonTableHeader } from "./ui/comparison-table";

export function ComparisonSection({ t }: WithT) {
  const comparisons = [
    {
      category: "プレイリスト管理",
      official: "プラットフォーム内のみ",
      thirdParty: "手動でコピー・ペースト",
      playlistWizard: "ワンクリックで一括管理",
      officialIcon: X,
      thirdPartyIcon: X,
      wizardIcon: Check,
    },
    {
      category: "プラットフォーム対応",
      official: "単一プラットフォームのみ",
      thirdParty: "限定的な対応",
      playlistWizard: "統合ダッシュボード",
      officialIcon: X,
      thirdPartyIcon: X,
      wizardIcon: Check,
    },
    {
      category: "検索機能",
      official: "基本的な検索のみ",
      thirdParty: "シンプルな絞り込み",
      playlistWizard: "AI駆動の高度検索",
      officialIcon: X,
      thirdPartyIcon: X,
      wizardIcon: Check,
    },
    {
      category: "バックアップ",
      official: "プラットフォーム依存",
      thirdParty: "手動でエクスポート",
      playlistWizard: "自動バックアップ",
      officialIcon: X,
      thirdPartyIcon: X,
      wizardIcon: Check,
    },
  ];

  return (
    <section className="w-full bg-gray-900 py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <FadeInUpInScreenAnimation className="mb-16 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-pink-300 text-sm">
              <ArrowRight className="h-4 w-4" />
              比較
            </div>
            <h2 className="font-bold text-3xl text-white tracking-tight sm:text-4xl">
              従来の方法 vs{" "}
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                PlaylistWizard
              </span>
            </h2>
            <p className="max-w-[600px] text-gray-300 text-lg">
              PlaylistWizardがどのように音楽管理を改善するかをご覧ください
            </p>
          </div>
        </FadeInUpInScreenAnimation>

        <ComparisonTable>
          <ComparisonTableHeader />
          {comparisons.map((item, index) => (
            <ComparisonRowAnimation key={item.category} index={index}>
              <div className="grid grid-cols-4 gap-0">
                <div className="border-gray-700 border-b p-6">
                  <span className="font-medium text-white">
                    {item.category}
                  </span>
                </div>
                <div className="border-gray-700 border-b border-l p-6">
                  <div className="flex items-center gap-3">
                    <item.officialIcon className="h-5 w-5 flex-shrink-0 text-red-400" />
                    <span className="text-gray-300 text-sm">
                      {item.official}
                    </span>
                  </div>
                </div>
                <div className="border-gray-700 border-b border-l p-6">
                  <div className="flex items-center gap-3">
                    <item.thirdPartyIcon className="h-5 w-5 flex-shrink-0 text-red-400" />
                    <span className="text-gray-300 text-sm">
                      {item.thirdParty}
                    </span>
                  </div>
                </div>
                <div className="border-gray-700 border-b border-l bg-gradient-to-r from-pink-500/5 to-purple-500/5 p-6">
                  <div className="flex items-center gap-3">
                    <item.wizardIcon className="h-5 w-5 flex-shrink-0 text-green-400" />
                    <span className="font-medium text-sm text-white">
                      {item.playlistWizard}
                    </span>
                  </div>
                </div>
              </div>
            </ComparisonRowAnimation>
          ))}
        </ComparisonTable>
      </div>
    </section>
  );
}
