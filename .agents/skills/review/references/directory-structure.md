# ディレクトリ構成

```bash
├── app # Next.js アプリケーション
│   ├── designs
│   │   └── images
│   ├── drizzle # Drizzle が生成するマイグレーションファイルなど。 DO NOT EDIT MANUALLY.
│   ├── mocks # モックデータやモックサーバーのコード
│   ├── public
│   └── src
│       ├── app
│       │   ├── [lang]
│       │   │   ├── (with-nav) # ヘッダーやサイドメニューなどのナビゲーションがあるページ
│       │   │   └── (without-nav) # ヘッダーやサイドメニューなどのナビゲーションがないページ
│       │   └── api
│       │       ├── auth
│       │       └── v1
│       ├── common # @soft-deprecated これからリファクタリングしていくコード。新しいコードはこのディレクトリに追加しないこと。今後は /lib に移行される
│       ├── components # 再利用可能な React コンポーネント shadcn/ui などの外部ライブラリのコンポーネントもここに配置する
│       ├── constants # URL などの定数
│       ├── content
│       ├── entities # ドメインエンティティの定義
│       ├── features
│       │   ├── playlist
│       │   │   ├── components
│       │   │   │   ├── actions
│       │   │   │   └── structured-playlists-definition-preview
│       │   │   ├── contexts
│       │   │   ├── entities # @soft-deprecated これからリファクタリングしていくコード。新しいコードはこのディレクトリに追加しないこと。今後は /entities に移行される
│       │   │   ├── queries
│       │   │   └── utils
│       │   ├── settings
│       │   │   └── components
│       │   └── user-menu
│       │       └── components
│       ├── hooks # @soft-deprecated これからリファクタリングしていくコード。新しいコードはこのディレクトリに追加しないこと。今後は /lib/hooks に移行される
│       ├── images
│       ├── lib # 汎用的なコード。ユーティリティ関数やカスタムフックなど
│       │   ├── db
│       │   └── hooks
│       ├── presentation # @soft-deprecated これからリファクタリングしていくコード。新しいコードはこのディレクトリに追加しないこと。今後は /features/[feature_name]/components に移行される
│       │   ├── hooks
│       │   │   └── t
│       │   ├── hydrator
│       │   ├── pages
│       │   │   └── layouts
│       │   │       ├── footer
│       │   │       └── header
│       │   └── providers
│       ├── repository # 実際のAPI呼び出しなどを行うコード。各プロバイダごとに Repository を定義し、インターフェースを満たすように実装することで、プロバイダごとの実装の違いを吸収する
│       │   ├── providers
│       │   ├── structured-playlists
│       │   └── v2 # 新しい Repository のコード。移行のきっかけや背景は ![](/docs/repository-v2/README.md) を参照
│       │       └── youtube
│       │           └── schemas
│       └── usecase
│           ├── actions
│           ├── command
│           │   └── jobs
│           ├── interface
│           ├── utils
│           └── value-object
├── assets
├── docs
├── packages
│   ├── core
│   ├── env
│   ├── logger
│   ├── shared
│   ├── shared-ui
│   └── youtube # @soft-deprecated repository v1 の YouTube 実装。これから repository v2 に移行するために deprecated
└── scripts
```