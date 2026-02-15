export * as ga4Events from "./ga4-events";
export * as queryKeys from "./query-keys";
export * as urls from "./urls";

export const VERSION = `v${process.env.RELEASE}`;

export const DEFAULT = "default";

import { supportedLangs } from "@/features/localization/i18n";
import * as urls from "./urls";
export const DEFAULT_CLOSE_SIDEBAR_ROUTES = [
  supportedLangs.map((lang) => urls.home(lang)),
].flat();
