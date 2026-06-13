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
