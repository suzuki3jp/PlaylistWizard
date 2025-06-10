import type { JobInterface } from "./jobs";

export interface CommandInterface {
  jobs: JobInterface[];
  redo: () => Promise<void>;
  undo: () => Promise<void>;
}
