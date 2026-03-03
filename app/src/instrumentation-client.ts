import * as Sentry from "@sentry/nextjs";
import "../sentry.client.config";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
