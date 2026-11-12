import { toStepId } from "@playlistwizard/playlist-action-job";
import { describe, expect, it, vi } from "vitest";
import type { QueueLike } from "../../env";
import { CloudflareStepQueue } from "./cloudflare-step-queue";

describe("CloudflareStepQueue", () => {
  it("splits many messages into Cloudflare-sized batches", async () => {
    const queue = {
      send: vi.fn<QueueLike["send"]>(async () => undefined),
      sendBatch: vi.fn<QueueLike["sendBatch"]>(async () => undefined),
    };
    const messages = Array.from({ length: 250 }, (_, index) => ({
      stepId: toStepId(`step-${index}`),
    }));

    await new CloudflareStepQueue(queue).sendMany(messages);

    expect(queue.sendBatch).toHaveBeenCalledTimes(3);
    expect(
      queue.sendBatch.mock.calls.map(([batch]) => [...batch].length),
    ).toEqual([100, 100, 50]);
    expect([...queue.sendBatch.mock.calls[0][0]][0]).toEqual({
      body: { stepId: "step-0" },
    });
  });
});
