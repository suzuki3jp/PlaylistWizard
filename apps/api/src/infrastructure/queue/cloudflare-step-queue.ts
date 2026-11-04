import type { QueueLike } from "../../env";
import type { StepQueue } from "../../usecase/playlist-actions/ports";

// Cloudflare Queues accepts at most 100 messages per sendBatch call.
const SEND_BATCH_LIMIT = 100;

export class CloudflareStepQueue implements StepQueue {
  constructor(private readonly queue: QueueLike) {}

  send(message: Parameters<StepQueue["send"]>[0]) {
    return this.queue.send(message);
  }

  async sendMany(messages: Parameters<StepQueue["sendMany"]>[0]) {
    for (let offset = 0; offset < messages.length; offset += SEND_BATCH_LIMIT) {
      await this.queue.sendBatch(
        messages
          .slice(offset, offset + SEND_BATCH_LIMIT)
          .map((body) => ({ body })),
      );
    }
  }
}
