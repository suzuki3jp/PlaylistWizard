import {
  SiGoogle as Google,
  SiSpotify as Spotify,
} from "@icons-pack/react-simple-icons";
import type { LucideIcon } from "lucide-react";

export const SupportedProvider = {
  Google: "google",
  Spotify: "spotify",
} as const;

export type SupportedProvider =
  (typeof SupportedProvider)[keyof typeof SupportedProvider];

export const ALL_PROVIDERS: SupportedProvider[] = [
  SupportedProvider.Google,
  SupportedProvider.Spotify,
];

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
  [SupportedProvider.Spotify]: {
    label: "Spotify",
    Icon: Spotify,
    iconColor: "text-[#1DB954]",
  },
};

export function getProviderMeta(providerId: string): ProviderMeta | undefined {
  return PROVIDER_META[providerId as SupportedProvider];
}

export interface DisconnectTarget {
  providerId: string;
  accountId: string;
}
