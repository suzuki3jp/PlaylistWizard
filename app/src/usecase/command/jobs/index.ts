import type { Result } from "@/usecase/actions/plain-result";
import { Command } from "../command";

export interface JobInterface {
  // biome-ignore lint/suspicious/noExplicitAny: TODO
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
