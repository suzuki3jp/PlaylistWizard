import type { TFunction } from "i18next";

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type WithT<T = {}> = T & { t: TFunction };
