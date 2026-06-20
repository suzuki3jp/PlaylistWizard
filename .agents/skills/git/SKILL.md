---
name: git
description: git に関する全ての操作やこのプロジェクトのgitに関する情報が欲しい時に呼び出されるスキル（branch, commit, push, pull, merge ...）
---

# Constitution
- NEVER: コミットには co-author を指定しないこと。
- NEVER: main に対して、直接の操作は禁止する。しかし、例外として main の pull、その他 main に影響しない操作（main -> develop のマージなど）は可能とする。
- NEVER: **ユーザーからの明示的な指示がない限り** develop に対しても、前述の main の規則が適用されるものとする。
  - しかし、ユーザーから明示的な指示があった場合、直接のコミットなどを可能とする
- ALWAYS: コミットメッセージは conventional commit 形式に従うこと。詳しくは後述のコミットメッセージセクションを参照
- ALWAYS: コミットメッセージは何を変更したかよりも、なぜ変更したかが記述されていることが好ましい。
- ALWAYS: ブランチ名は {type}/{issue_number?}/{branch_name} に従うこと。詳しくは後述のブランチ名セクションを参照
- NEVER: ブランチ名に codex/ など、指定形式以外のprefixを付けない。
- ALWAYS: 変更内容が複数の独立した関心事を含む場合は複数のコミットに分割する。すでにステージング済みのファイルがある場合でも、コミット単位で適切に分割すること。
- ALWAYS: Codex App などの Sandbox 環境では、git push などでネットワークアクセスで弾かれる場合がある。その時はユーザー確認を挟むことでネットワークアクセスの承認を得る必要がある。

# コミットメッセージ
コミットメッセージは以下のような conventional commit 形式に従い、基本的には英語で記述すること。
```
{type}({scope?}): {message}
```
それぞれの変数が取りうる値は以下:
- type: コミットの種類（例: feat, fix, refactor, chore など）
- scope: コミットの対象となる範囲（例: www, api, core など）。これは省略可能。
- message: コミットメッセージ。英語で記述すること。

例:
```
feat(www): add login page
ci: update test ci
```

# ブランチ名
ブランチ名は以下のような形式に沿って作成すること。
```
{type}/{issue_number?}/{branch_name}
```

それぞれの変数が取りうる値は以下:
- type: ブランチの種類（例: feat, fix, refactor, chore など）
- issue_number: 関連する GitHub の Issue 番号。これはユーザーから Issue 番号の共有がない限り、確認せず省略して良い。
- branch_name: ブランチ名

例:
```
feat/123/login-page
perf/reduce-rendering
```
