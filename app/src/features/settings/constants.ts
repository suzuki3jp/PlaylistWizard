import { SiGoogle as Google } from "@icons-pack/react-simple-icons";
import type { LucideIcon } from "lucide-react";

export const SupportedProvider = {
  Google: "google",
} as const;

export type SupportedProvider =
  (typeof SupportedProvider)[keyof typeof SupportedProvider];

export const ALL_PROVIDERS: SupportedProvider[] = [SupportedProvider.Google];

export interface ProviderMeta {
  label: string;
  Icon: LucideIcon;
  iconColor: string;
}

export const PROVIDER_META: Record<SupportedProvider, ProviderMeta> = {
  [SupportedProvider.Google]: {
    label: "Google",
    Icon: Google,
    iconColor: "text-white",
  },
};

export function getProviderMeta(providerId: string): ProviderMeta | undefined {
  return PROVIDER_META[providerId as SupportedProvider];
}

export interface DisconnectTarget {
  id: string; // account.id (DB PK)
  providerId: string;
  accountId: string;
}
