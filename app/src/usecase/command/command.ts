import type { JobInterface } from "./jobs";

export interface CommandInterface {
  jobs: JobInterface[];
  undo: () => Promise<void>;
}

export class Command implements CommandInterface {
  constructor(public readonly jobs: JobInterface[]) {}

  async undo() {
    for (let i = this.jobs.length - 1; i >= 0; i--) {
      const job = this.jobs[i];

      // @ts-expect-error
      await job.undo();
    }
  }
}
