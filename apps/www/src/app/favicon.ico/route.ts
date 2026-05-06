import { getAppIcon } from "@/lib/app-icon";

export const GET = (request: Request) => {
  const icon = getAppIcon();

  return Response.redirect(new URL(icon.src, request.url), 307);
};
