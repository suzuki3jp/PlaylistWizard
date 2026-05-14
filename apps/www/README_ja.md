<img src="https://raw.githubusercontent.com/suzuki3jp/PlaylistWizard/c34ac5a7113316bc92680c051f282bd5f487f405/assets/banner-small.png"/>

<hr />

<p align="center">
<a href="https://playlistwizard.app/ja"><b>今すぐ試してみる！👉 playlistwizard.app</b></a><br />
<i>READMEの言語: <a href="/apps/www/README.md">English</a> | <a href="/apps/www/README_ja.md">日本語</a></i>
</p>

<hr />

[![Website](https://deploy-badge.vercel.app/?url=http%3A%2F%2Fplaylistwizard.app&name=playlistwizard.app)](https://playlistwizard.app/en)
[![Test Workflow](https://github.com/suzuki3jp/PlaylistWizard/actions/workflows/test.yml/badge.svg)](https://github.com/suzuki3jp/playlistwizard/actions)
[![Code Coverage](https://codecov.io/gh/suzuki3jp/PlaylistWizard/graph/badge.svg?token=UH5HX39VG7)](https://codecov.io/github/suzuki3jp/playlistwizard)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/suzuki3jp/playlistwizard)](https://github.com/suzuki3jp/playlistwizard/pulse)
[![GitHub last commit](https://img.shields.io/github/last-commit/suzuki3jp/playlistwizard)](https://github.com/suzuki3jp/playlistwizard/commits/main)

**PlaylistWizard** は、プレイリストを管理・整理するためのWebサイトです。

<video autoplay loop muted playsinline>
  <source src="https://github.com/user-attachments/assets/a9130cfb-cb22-40eb-b02c-b2c9aa1ee27a" type="video/webm">
  <source src="https://github.com/user-attachments/assets/f5083ee1-cfe2-4fe3-bfa1-87a3358eef3c" type="video/mp4">
</video>

<i>スクリーンショットをもっと見る 👉 <a href="/assets/v3">/assets/v3</a></i>

# ✨ 主な機能
- 🎯 **直感的なインターフェース**: プレイリスト管理のためのユーザーフレンドリーなGUI
- 🛠️ **プレイリスト管理**: プレイリストのコピー、シャッフル、マージ、抽出、削除
- ↩️ **Undo機能（ベータ版）**: プレイリスト操作を安全に取り消し
- 📋 **構造化プレイリスト（ベータ版）**: 構造化プレイリスト定義ファイル（JSON）を使用してプレイリストを同期
- 🔍 **プレイリストブラウザ**: プレイリスト項目の検索・閲覧
- 📥 **プレイリストインポート**: 他のユーザーが所有するプレイリストのインポート
- 🌐 **マルチプラットフォーム**: 複数のプラットフォームをサポート（YouTube、YouTube Music）
- 🌍 **多言語対応**: 複数の言語で利用可能（英語、日本語）

# 🛠️ 開発環境のセットアップ

1. リポジトリをクローン
    ```bash
    git clone https://github.com/suzuki3jp/PlaylistWizard.git
    cd PlaylistWizard
    ```

2. 依存関係のインストール＆パッケージビルド
    ```bash
    pnpm bootstrap
    ```

3. 環境変数の設定
    ```bash
    cd apps/www
    cp .env.example .env
    # .envファイルに適切な値を設定してください
    ```

4. 開発サーバーの起動
    ```bash
    pnpm dev
    ```

# 🚀 ロードマップ
- [ ] クロスサービスプレイリスト転送
- [ ] 追加プラットフォームのサポート

💡 新機能のアイデアがありますか？ぜひ[issue](https://github.com/suzuki3jp/playlistwizard/issues/new)で教えてください！