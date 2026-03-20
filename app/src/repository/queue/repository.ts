import "server-only";
import type { QueueMessage } from "@/lib/schemas/jobs";

/**
 * 中継 Cloudflare Worker の HTTP エンドポイント経由で Queue にメッセージを投入する。
 * Next.js は Cloudflare Bindings を直接使えないため、Worker 経由でエンキューする。
 *
 * 環境変数:
 *   CLOUDFLARE_WORKER_URL  - 中継 Worker の URL (e.g. https://worker.example.com)
 *   WORKER_SECRET          - Cloudflare Worker との共有シークレット
 */
export class QueueRepository {
  async enqueue(messages: QueueMessage[]): Promise<void> {
    const workerUrl = process.env.CLOUDFLARE_WORKER_URL;
    const workerSecret = process.env.WORKER_SECRET;

    if (!workerUrl || !workerSecret) {
      throw new Error(
        "Queue is not configured. Set CLOUDFLARE_WORKER_URL and WORKER_SECRET environment variables.",
      );
    }

    const res = await fetch(`${workerUrl}/enqueue`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${workerSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) {
      throw new Error(
        `Failed to enqueue messages: ${res.status} ${res.statusText}`,
      );
    }
  }
}

export const queueRepository = new QueueRepository();
