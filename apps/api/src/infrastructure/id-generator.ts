import type { IdGenerator } from "../usecase/playlist-actions/ports";

export const cryptoRandomIdGenerator: IdGenerator = {
  generate: () => crypto.randomUUID(),
};
