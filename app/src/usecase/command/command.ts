import type { JobInterface } from "./jobs";

export interface CommandInterface {
  jobs: JobInterface[];
  redo: () => Promise<void>;
  undo: () => Promise<void>;
}

export class Command implements CommandInterface {
  constructor(public readonly jobs: JobInterface[]) {}

  async redo() {
    for (const job of this.jobs) {
      await job.redo();
    }
  }
  async undo() {
    for (let i = this.jobs.length - 1; i >= 0; i--) {
      const job = this.jobs[i];
      await job.undo();
    }
  }
}
