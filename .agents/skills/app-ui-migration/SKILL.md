---
name: app-ui-migration
description: app 側のページ実装を `@playlistwizard/ui` へページ単位で移行するための方針。`@/components/ui/*` import の置換、共通コンポーネント化、既存表示差分の抑制、packages/ui 側の variant 設計を伴う作業で参照すること。
---

app 側のページ実装を `@playlistwizard/ui` へ移行するときのルール。

# Constitution
- NEVER: 表示差分を確認せずに semantic token や共通コンポーネントのベーススタイルへ丸めないこと。
- NEVER: ページ固有 token を増やさないこと。
  - 例: `--home-*`, `--settings-*` のような token は作らない。
  - ページ固有 token を作るくらいなら、ページ側で直接 Tailwind class を指定する。
- NEVER: `Button` など汎用 component の `default` variant を、特定ページの CTA や marketing 表現に合わせて変更しないこと。
- ALWAYS: 既存ページの見た目を原則として保持すること。
- ALWAYS: 対象ページが `/settings` のように既存の主要デザインパターンから明らかにズレている場合は、現状維持ではなく既存パターンに合わせて変更するかユーザーに確認すること。
- ALWAYS: 迷った場合は、既存ページの実装スタイルと `packages/ui` の現行スタイルのどちらを共通 component のベースにするか、ユーザーに確認すること。
- ALWAYS: ページ単位で `@/components/ui/*` import が残っていないことを確認すること。
- ALWAYS: 移行後に `biome check` と TypeScript check を対象範囲で実行すること。

# 移行の進め方
1. 対象ページ配下の `@/components/ui/*` import を洗い出す。
   ```bash
   rg -n "@/components/ui" apps/www/src/features/<page> apps/www/src/app -g '*.{ts,tsx}'
   ```
2. `apps/www/src/components/ui/*` と `packages/ui/src/components/*` の差分を確認する。
   - import path だけの差分なら、原則そのまま `@playlistwizard/ui` に置換する。
   - class の差分がある場合は、既存ページの表示を基準にする。
3. ページ側 import を `@playlistwizard/ui` に置換する。
4. 共通 component 側に寄せるべき重複スタイルがあるか判断する。
5. 対象ページで app 側 UI import が残っていないことを確認する。
6. 対象範囲の `biome check`、`pnpm --filter @playlistwizard/ui build`、`pnpm --filter @playlistwizard/www exec tsc --noEmit` を実行する。

# 共通 component の設計判断

## Button
- `default` は汎用 UI のデフォルトとして維持する。
- CTA / marketing 用の見た目は `variant="cta"` のような明示的 variant を追加する。
- ページ固有の padding や typography は、共通化する必然性がなければページ側 `className` に残す。
  - 例: home の CTA は `variant="cta"` + `className="px-8 py-4 font-semibold text-lg"`。
- 既存ページで `variant="outline"` に明示 class がある場合、その class が既存表示を守るための指定である可能性が高い。勝手に削らない。

## Badge
- `default` は小さい汎用 badge として維持する。
  - `MultipleSelector` などフォーム系 UI は default badge に依存することがある。
- home のような大きい marketing badge は `variant="marketing"` のように明示する。
- あるページの見た目に合わせて default badge を大型化しない。

## Dialog / Input / Select / Skeleton / Progress / Accordion / Checkbox
- まず app 側実装と `packages/ui` 側実装を diff する。
- import path 以外の差分がほぼなければ、そのまま置換してよい。
- Dialog の background / text color のような差分は visual regression が出やすい。既存ページ側で className override があるか確認する。

## Multi Select
- `packages/ui` の `MultipleSelector` は named export。
  - 正: `import { MultipleSelector, type Option } from "@playlistwizard/ui";`
  - 誤: `import MultipleSelector from "@playlistwizard/ui";`
- 内部で `Badge` を使うため、`Badge` default の変更は Multi Select の見た目に波及する。

# Token 方針
- semantic token として複数ページ・複数 component に意味があるものだけ `packages/ui` に追加する。
- ページ固有の色、グラデーション、余白を token 化しない。
- token 化するか迷う場合は、まず直接 class を残す。
- 既存の hardcoded Tailwind class を無理に semantic token へ置き換えない。置き換えは visual regression が出ない範囲に限る。

# 表示差分の扱い
- 移行は「UI package へ依存を寄せる」作業であって、リデザインではない。
- 既存のグラデーション、色、border、padding、hover state は保持する。
- ただし、対象ページ自体がアプリ内の既存デザインパターンから明らかに外れている場合は例外。
  - 例: 他ページは `gray-*` 系なのに、そのページだけ `zinc-*` 系でカード/境界線が浮いている。
  - この場合は、既存パターンへ揃える変更を行うか、現状維持するかをユーザーに確認する。
- 差分が出た場合は以下の順で判断する。
  1. import 置換だけで戻せるなら戻す。
  2. 複数ページで同じ意味のスタイルなら `packages/ui` の variant として追加する。
  3. そのページだけの見た目ならページ側 className に残す。
  4. どちらを共通 component のベースにするか迷ったらユーザーに確認する。

# 検証コマンド
対象ページに応じて範囲を絞って実行する。

```bash
./node_modules/.bin/biome check apps/www/src/features/<page> packages/ui/src/components/<component>.tsx
pnpm --filter @playlistwizard/ui build
pnpm --filter @playlistwizard/www exec tsc --noEmit
```

`biome check apps/www/src/features/<page>` で既存 warning が出る場合は、今回 touched file かどうかを切り分ける。touched file の軽微な未使用引数などは修正してよいが、無関係な大規模修正はしない。
