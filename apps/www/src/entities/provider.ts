import type { Provider as CoreProviderType } from "@playlistwizard/core/provider";
import {
  Provider as CoreProvider,
  toProvider,
} from "@playlistwizard/core/provider";

export const Provider = CoreProvider;
export { toProvider };
export type Provider = CoreProviderType;
