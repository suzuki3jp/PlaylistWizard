<img src="https://raw.githubusercontent.com/suzuki3jp/PlaylistWizard/c34ac5a7113316bc92680c051f282bd5f487f405/assets/banner-small.png"/>

<hr />

<p align="center">
<a href="https://playlistwizard.suzuki3.jp/ja"><b>今すぐ試してみる！👉 playlistwizard.suzuki3.jp</b></a><br />
<i>READMEの言語: <a href="/app/README.md">English</a> | <a href="/app/README_ja.md">日本語</a></i>
</p>

<hr />

[![Website](https://deploy-badge.vercel.app/?url=http%3A%2F%2Fplaylistwizard.suzuki3.jp&name=playlistwizard.suzuki3.jp)](https://playlistwizard.suzuki3.jp/en)
[![Test Workflow](https://github.com/suzuki3jp/PlaylistWizard/actions/workflows/test.yml/badge.svg)](https://github.com/suzuki3jp/playlistwizard/actions)
[![Code Coverage](https://codecov.io/gh/suzuki3jp/PlaylistWizard/graph/badge.svg?token=UH5HX39VG7)](https://codecov.io/github/suzuki3jp/playlistwizard)
![LOC](https://tokei.rs/b1/github/suzuki3jp/playlistwizard)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/suzuki3jp/playlistwizard)](https://github.com/suzuki3jp/playlistwizard/pulse)
[![GitHub last commit](https://img.shields.io/github/last-commit/suzuki3jp/playlistwizard)](https://github.com/suzuki3jp/playlistwizard/commits/main)

**Playlist Wizard** は、プレイリストを管理・整理するためのWebサイトです。
<div style="text-align: center; margin-top: 1rem; margin-bottom: 2rem;">
    <img src="https://raw.githubusercontent.com/suzuki3jp/PlaylistWizard/28b4a49f92ba217c1ae9db1c87fd83076fab0e75/assets/playlist-management-comparison.jpg" width="800"/>
</div>
<img src="https://github.com/suzuki3jp/PlaylistWizard/blob/4c24a9df8e0bb37402f808a6be0420e3522288a4/assets/v3/playlists.png?raw=true"/>
<i>スクリーンショットをもっと見る 👉 <a href="/assets/v3">/assets/v3</a></i>

# ✨ 主な機能
- 🎯 **直感的なインターフェース**: プレイリスト管理のためのユーザーフレンドリーなGUI
- 🛠️ **プレイリスト管理**: プレイリストのコピー、シャッフル、マージ、抽出、削除
- ↩️ **Undo機能（ベータ版）**: プレイリスト操作を安全に取り消し
- 🔍 **プレイリストブラウザ**: プレイリスト項目の検索・閲覧
- 📥 **プレイリストインポート**: 他のユーザーが所有するプレイリストのインポート
- 🌐 **マルチプラットフォーム**: 複数のプラットフォームをサポート（YouTube、YouTube Music、Spotify）
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
    cd app
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