import { API_AUTH_BASE_PATH, resolveApiUrl } from "@playlistwizard/shared";
import { type NextRequest, NextResponse } from "next/server";
import { requirePublicApiOrigin } from "@/lib/api-url";

export const toVersionedAuthPath = (pathname: string): string =>
  pathname.replace(/^\/api\/auth(?=\/|$)/, API_AUTH_BASE_PATH);

const redirectToWorkersAuth = (request: NextRequest): NextResponse => {
  const url = resolveApiUrl(
    requirePublicApiOrigin(),
    toVersionedAuthPath(request.nextUrl.pathname) + request.nextUrl.search,
  );
  return NextResponse.redirect(url, 307);
};

export const GET = redirectToWorkersAuth;
export const POST = redirectToWorkersAuth;
export const OPTIONS = (): Response => new Response(null, { status: 204 });
