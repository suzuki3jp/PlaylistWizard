// Proxy endpoint to fetch YouTube's "no thumbnail" image.
// no_thumbnail.jpg returns a 404 status but still contains valid image data in the response body.
// next/image treats non-2xx responses as errors and shows alt text instead of the image.
// This proxy re-serves the body with a 200 status to allow next/image to display it correctly.

import { type NextRequest, NextResponse } from "next/server";
import { urls } from "@/constants";

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(urls.youtubeApiNoThumbnail());

    return new Response(await res.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/assets/ogp.png", request.url));
  }
}
