---
name: github
description: GitHub に関する全ての操作やこのプロジェクトの GitHub に関する情報が欲しい時に呼び出されるスキル（PR, Issue）
---

# Constitution
- NEVER: PR のマージは行わないこと
- NEVER: Draft PR はユーザーからの明示的な指示がない限り作成しないこと
- ALWAYS: gh を使用し、直接 curl などでは叩かないこと。gh graphql で API を叩くことは可とする。
- ALWAYS: gh の認証が切れている場合は、ユーザーにログインのためのコマンドと一緒にログインを促すこと。
- ALWAYS: PR のタイトルは Conventional commit 形式に従うこと。また、タイトルや本文は全て英語で記述すること。
- Sandbox 環境では、通常権限での `gh auth status` の結果を確定情報として扱わないこと。
- `token is invalid`、未認証、credential unavailable など、理由を問わず `gh` の認証確認に失敗した場合は、ユーザーにログインを依頼する前に、同じコマンドを `require_escalated` で再実行すること。
- 権限昇格後も認証失敗した場合に限り、`gh auth login` を案内すること。
- 「ユーザー確認を挟む」とはチャットで許可を尋ねることではなく、ツールの権限昇格リクエストを出すことを意味する。
