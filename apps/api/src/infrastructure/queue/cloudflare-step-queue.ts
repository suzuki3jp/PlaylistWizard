import type { QueueLike } from "../../env";
import type { StepQueue } from "../../usecase/playlist-actions/ports";

export class CloudflareStepQueue implements StepQueue {
  constructor(private readonly queue: QueueLike) {}

  send(message: Parameters<StepQueue["send"]>[0]) {
    return this.queue.send(message);
  }
}
