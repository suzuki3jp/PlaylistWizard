---
name: nextjs-data-fetching
description: Next.js AppRouter における、データフェッチング、データベースへのクエリ発行のベストプラクティス。データフェッチを伴う処理を実装、変更する場合はこのドキュメントを参照すること。
---

ここでのデータフェッチは以下のようなものを含む。
- fetch を用いた API からのデータフェッチ
- データベースへのクエリ発行（ORM などを活用した場合も同様）

# Constitution
- NEVER: layout.tsx では無いと UI が成立しないデータ以外のデータフェッチを行わないこと。
  - 例: セッションデータはほとんどのコンポーネントで使用することになるはずで、それがないと UI が成立しないことが多いため、layout.tsx でフェッチすることは許容する。
  - 例: プレイリストのデータなどほとんどのデータフェッチは page.tsx で行うべきである。これらは layout.tsx でフェッチする必要はない。
- ALWAYS: Tanstack Query を使用してクライアントサイドでのデータフェッチはユーザーの操作による発火など、必要な場面でのみ採用すること。
- ALWAYS: Tanstack Query を使用してクライアントサイドでのデータフェッチでページ読み込み時にもデータが必要な場合は、サーバーサイドで prefetch すること。詳細は Prefetching のセクションを参照。
- ALWAYS: データフェッチは依存関係が無いものは並列で行うこと。サーバーサイドでは Promise.allSettled を使用して、クライアントサイドでは Tanstack Query の useQueries を使用して並列でデータフェッチを行うこと。

# Server-side Data Fetching
サーバーサイドでのデータフェッチングは以下のようなコードで行う。
要点: 
- データフェッチを行うサーバーコンポーネントは Suspense でラップするか、ページ全体が loading の場合 loading.tsx を使用すること。
  - これにより、データフェッチでページ全体がブロックされることを防ぎ、TTFB の改善につながる。
- Loading UI は下記のコードでは簡略化されているが、実際にはレイアウトシフトを防ぐために、適切にスケルトンなどを活用するべきである。
```tsx
import { Suspense } from "react";

export function SomePage() {
  return (
    <>
      <Header /> 
      <Suspense fallback={<BarLoading />}>
        <Bar />
      </Suspense>
    </>
  );
}

export function BarLoading() {
  return <div>Loading...</div>;
}

export async function Bar() {
  const res = await fetch("https://example.com");
  const data = await res.json();

  return <div>{data}</div>;
}
````

# Suspense
サーバーコンポーネントでのデータフェッチにおける Suspense の仕様に関しては、 Server-side Data Fetching セクションを参照。

以下ではクライアントサイドにおける Suspense の使用のガイドラインを示す。
要点は以下:
- クライアントサイドでの useSuspenseQuery による Suspense の活用はで、このアプリケーションでは導入していないため、クライアントサイドでの Suspense の使用は推奨しない。
- そもそも、クライアントサイドでの Suspense は Loading UI の実装が簡潔になる程度のメリットしか無い。
- このアプリケーションでのクライアントサイドデータフェッチの Loading UI は、useQuery が返す、isLoading、isError、data などの状態を活用して実装することとする。

# Prefetching
クライアントサイドでの Tanstack Query を使用したデータフェッチで、ページ読み込み時にもデータが必要な場合は、サーバーサイドで prefetch することが推奨される。
これにより、ユーザー操作の伴わない Tanstack Query のデータフェッチをサーバーサイドで行うことができ、クライアントに比べ比較的ネットワーク環境が安定しているサーバーサイドでデータフェッチを行うことで、パフォーマンスの向上につながる。

```tsx
// page.tsx（サーバーコンポーネント）
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

export default async function Page() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Posts />
    </HydrationBoundary>
  );
}

// Posts.tsx
'use client';

export function Posts() {
  const { data } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });
  return <div>{data}</div>;
}
```
