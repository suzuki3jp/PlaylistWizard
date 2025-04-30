import type { TFunction } from "i18next";

export interface SSRProps {
    params: Promise<Record<string, string>>;
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type WithT<T = {}> = T & { t: TFunction };
