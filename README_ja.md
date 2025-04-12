<h2 align="center">PlaylistWizard</h2>
<div align="center">YouTube (music) プレイリストマネージャー</div>

![PlaylistManagerDemo](./assets/demo2.gif)

## オンラインデモ
[オンラインデモ](https://playlistwizard.suzuki3.jp) をご覧ください

## 機能
- WebGUI から YouTube プレイリストを管理する
- プレイリストをコピー
- プレイリストのアイテムをシャッフル
- プレイリスト同士を結合
- プレイリストのアイテムをアーティスト名で抽出する
- プレイリストを削除
- プレイリストのアイテムを検索する
- 多言語対応（英語 & 日本語）

## ロードマップ
- プレイリストのアイテムを歌手名や曲名でソートする
- マルチプラットフォーム対応 (YouTube, Spotify, Amazon music ...)

## 使用方法
### オンラインデモにアクセスする
こちら: https://playlistwizard.suzuki3.jp

### 自分でビルドする
このアプリケーションをクローンして実行するには、[Git](https://git-scm.com), [Node.js](https://nodejs.org/en/download/), [pnpm](https://pnpm.io/) がインストールされている必要があります。
コマンド: 
```bash
# このリポジトリをクローンする
$ git clone https://github.com/suzuki3jp/PlaylistManager.git

# リポジトリに移動する
$ cd PlaylistManager

#`app/sample.env` を `app/.env` に変更し、適切な値を入力する

# 依存関係のインストール
$ pnpm install

# アプリケーションの実行
$ pnpm dev
```
## License

[MIT License](./LICENSE)

## Disclaimer

PlaylistWizard is an independently developed application that utilizes the YouTube Data API to streamline playlist management through features such as copying, shuffling, merging, and deleting playlists.

This application is not affiliated with, endorsed by, or in any way officially connected to YouTube or Google. All product and company names are trademarks™ or registered® trademarks of their respective holders.

Users must comply with YouTube's Terms of Service, and it is the user's responsibility to ensure compliance with all applicable terms and conditions when using this application.

The developer accepts no responsibility or liability for any damages, losses, or consequences that may arise from the use of this application. Use of this application is entirely at your own risk.