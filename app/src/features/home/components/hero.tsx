import { FadeInUpAnimation } from "@/lib/components/animations/fade-in-up";
import { Zap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative flex h-[calc(100vh-4rem)] w-full items-center justify-center">
      <div className="container relative z-10 px-4 md:px-6">
        <FadeInUpAnimation className="mx-auto flex max-w-4xl flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-6">
            <FadeInUpAnimation
              delay={0.1}
              className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-4 py-2 font-medium text-pink-300 text-sm"
            >
              <Zap className="h-4 w-4" />
              次世代プレイリスト管理ツール
            </FadeInUpAnimation>

            <h1 className="font-bold text-5xl text-white tracking-tight sm:text-6xl xl:text-7xl">
              プレイリスト管理を
              <br />
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                革新する
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-gray-300 text-xl leading-relaxed">
              PlaylistWizardで、YouTubeとSpotifyのプレイリストを直感的に管理。
              <span className="font-semibold text-pink-400">AI駆動</span>
              の機能で、 あなたの音楽体験を次のレベルへ。
            </p>
          </div>
        </FadeInUpAnimation>
      </div>
    </section>
  );
}
