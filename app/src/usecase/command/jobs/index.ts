import { type Result, fail, ok } from "@/usecase/actions/plain-result";
import type { BaseProviderError } from "@/usecase/interface/provider";

export interface JobInterface {
  undo: () => Promise<Result<unknown>>;
  redo: () => Promise<Result<unknown>>;
}

export class JobsBuilder {
  private jobs: JobInterface[] = [];

  addJob(job: JobInterface): this {
    this.jobs.push(job);
    return this;
  }

  toJSON(): JobInterface[] {
    return this.jobs;
  }
}
