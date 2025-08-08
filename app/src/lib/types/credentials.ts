import type { ProviderRepositoryType } from "@/repository/providers/factory";

export interface WithCredentials {
  accessToken: string;
  provider: ProviderRepositoryType;
}
