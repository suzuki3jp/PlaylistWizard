import { DurableObject } from "cloudflare:workers";
import {
  parseSerializedJobProgressEvent,
  serializeJobProgressEvent,
} from "@playlistwizard/playlist-action-job";
import * as Sentry from "@sentry/cloudflare";
import type { Env } from "../../env";
import {
  JOB_PROGRESS_STREAM_CONNECT_PATH,
  JOB_PROGRESS_STREAM_PUBLISH_PATH,
} from "../../shared/job-progress-stream-internal-request";

export const INITIAL_SNAPSHOT_HEADER = "X-PlaylistWizard-Initial-Snapshot";

const isWebSocketUpgrade = (request: Request): boolean =>
  request.headers.get("Upgrade")?.toLowerCase() === "websocket";

export class PlaylistActionJobProgressStream extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === JOB_PROGRESS_STREAM_CONNECT_PATH) {
      return this.handleConnect(request);
    }

    if (url.pathname === JOB_PROGRESS_STREAM_PUBLISH_PATH) {
      return this.publish(request);
    }

    return new Response("Not Found", { status: 404 });
  }

  async webSocketMessage(ws: WebSocket): Promise<void> {
    ws.close(1008, "Client messages are not accepted");
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    Sentry.captureException(error, {
      tags: { "job.progress": "socket_error" },
    });
    ws.close(1011, "WebSocket error");
  }

  private handleConnect(request: Request): Response {
    if (!isWebSocketUpgrade(request)) {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }

    const initialSnapshot = request.headers.get(INITIAL_SNAPSHOT_HEADER);
    if (!initialSnapshot) {
      return new Response("Missing initial snapshot", { status: 400 });
    }

    // Validate through the shared parser before the snapshot crosses to the client.
    const serializedSnapshot = serializeJobProgressEvent(
      parseSerializedJobProgressEvent(initialSnapshot),
    );
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.ctx.acceptWebSocket(server);
    server.send(serializedSnapshot);

    return new Response(null, { status: 101, webSocket: client });
  }

  private async publish(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const serializedEvent = serializeJobProgressEvent(
      parseSerializedJobProgressEvent(await request.text()),
    );

    let delivered = 0;
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(serializedEvent);
        delivered += 1;
      } catch (error) {
        Sentry.captureException(error, {
          tags: { "job.progress": "socket_send_failed" },
        });
        ws.close(1011, "WebSocket send failed");
      }
    }

    return Response.json({ delivered });
  }
}
