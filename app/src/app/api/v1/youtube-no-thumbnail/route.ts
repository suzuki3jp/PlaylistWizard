// Proxy endpoint to fetch YouTube's "no thumbnail" image
// no_thumbnail.jpg returns 404 when accessed directly, so we need to proxy it to display by next/image

import { urls } from "@/constants";

export async function GET() {
  const res = await fetch(urls.youtubeApiNoThumbnail());

  return new Response(await res.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
