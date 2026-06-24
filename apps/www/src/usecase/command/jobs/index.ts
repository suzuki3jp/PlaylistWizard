import type { Result } from "@/usecase/actions/plain-result";
import { Command } from "../command";

export interface JobInterface {
  // TODO: Replace the legacy job payload type with a precise type.
  undo: (ctx: any) => Promise<Result<unknown>>;
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

  toCommand(): Command {
    return new Command(this.toJSON());
  }
}
