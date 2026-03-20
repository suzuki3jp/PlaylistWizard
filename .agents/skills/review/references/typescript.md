# TypeScript Best Practices
review スキルのためにこのアプリケーションにおいてのベストプラクティスをまとめる。

- TypeScript を常に使用すること。
- 型定義はできるだけ厳密にすること。
- any 型の使用は避けること。
- 値のハードコーディングは避けること。/constants ディレクトリに定数を定義して使用すること。
- Enum は避けること。オブジェクトとして定義し、`T[keyof T]` で型を定義すること。

## `as` アサーションの使用
- `as SomeType` によるキャストは可能な限り避けること。
- やむを得ず使用する場合は、なぜ安全かを示すコメントを必ず付与すること。
- `as string` / `as unknown as T` のような「逃げ」は特に注意して指摘すること。
- 型ガード関数（`(x): x is T => ...`）や valibot の `v.parse` を使った実行時バリデーションに置き換えられないか検討すること。

## Branded Types と層境界
- `toAccountId` / `toPlaylistId` / `toVideoId` などの Branded Type コンストラクタは **repository 層以下（境界変換）** でのみ呼ぶこと。
  - 具体的には `repository/v2/*/transformers.ts`、`repository/db/*/repository.ts`、`lib/user.ts` (BetterAuth セッションから UserId を取り出す箇所) のみで呼び出して良い。
  - Server Actions や API ルートハンドラで `toAccountId(body.accId)` のように外部入力を変換する場合は、その **直後に所有確認などのバリデーション** を行い、以降は変換済みの `AccountId` 型変数を使い回すこと（重複変換禁止）。
- repository 層より上位のコード（usecase / API routes / features 等）では、Branded Types をそのまま受け渡すこと。
  - 上位層で `toAccountId(someId)` を呼ぶ必要が生じた場合は、そもそも受け取り側の型定義が `string` になっていないか見直すこと。
- `p.id as string` のように Branded Type を素の `string` へ **ダウンキャスト** しているコードは誤りと見なして指摘すること。Branded Type は `string` の部分型なので明示的キャストなしに `string` を期待する関数には渡せるが、逆（`string → Branded`）はコンストラクタを使うこと。