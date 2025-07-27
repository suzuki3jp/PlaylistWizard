import type { ProviderRepositoryType } from "@/repository/providers/factory";
import type { TFunction } from "i18next";

export interface WithCredentials {
  accessToken: string;
  provider: ProviderRepositoryType;
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type WithT<T = {}> = T & { t: TFunction };
