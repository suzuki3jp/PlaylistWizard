import { type NextRequest, NextResponse } from "next/server";

const getAuthBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_BETTER_AUTH_URL is not set");
  return baseUrl;
};

const redirectToWorkersAuth = (request: NextRequest): NextResponse => {
  const url = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    getAuthBaseUrl(),
  );
  return NextResponse.redirect(url, 307);
};

export const GET = redirectToWorkersAuth;
export const POST = redirectToWorkersAuth;
export const OPTIONS = redirectToWorkersAuth;
