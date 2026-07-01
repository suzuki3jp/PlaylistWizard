import { toJobId, toStepId } from "@playlistwizard/playlist-action-job";
import type { IdGenerator } from "../usecase/playlist-actions/ports";

/**
 * Brands generated UUIDs at the infrastructure boundary before usecase code
 * receives them as Playlist Action Job identifiers.
 */
export const cryptoRandomIdGenerator: IdGenerator = {
  generateJobId: () => toJobId(crypto.randomUUID()),
  generateStepId: () => toStepId(crypto.randomUUID()),
};
