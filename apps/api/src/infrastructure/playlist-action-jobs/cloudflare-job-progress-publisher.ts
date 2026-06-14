import {
  createJobProgressRemovedEvent,
  createJobProgressUpdatedEvent,
  serializeJobProgressEvent,
} from "@playlistwizard/playlist-action-job";
import * as Sentry from "@sentry/cloudflare";
import type { JobProgressPublisher } from "../../usecase/playlist-actions/ports";

const PUBLISH_URL = "https://playlist-action-job-progress-stream/publish";

export class CloudflareJobProgressPublisher implements JobProgressPublisher {
  constructor(private readonly namespace: DurableObjectNamespace) {}

  async publishUpdated(
    input: Parameters<JobProgressPublisher["publishUpdated"]>[0],
  ): Promise<void> {
    const event = serializeJobProgressEvent(
      createJobProgressUpdatedEvent(input.job),
    );
    await this.publish(input.userId, event, input.job.id);
  }

  async publishRemoved(
    input: Parameters<JobProgressPublisher["publishRemoved"]>[0],
  ): Promise<void> {
    const event = serializeJobProgressEvent(
      createJobProgressRemovedEvent(input.jobId),
    );
    await this.publish(input.userId, event, input.jobId);
  }

  private async publish(
    userId: string,
    serializedEvent: string,
    jobId: string,
  ): Promise<void> {
    try {
      const id = this.namespace.idFromName(userId);
      const stub = this.namespace.get(id);
      const response = await stub.fetch(PUBLISH_URL, {
        body: serializedEvent,
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Progress publish failed: ${response.status}`);
      }
    } catch (error) {
      Sentry.captureException(error, {
        extra: { jobId },
        tags: { "job.progress": "publish_failed" },
      });
    }
  }
}
