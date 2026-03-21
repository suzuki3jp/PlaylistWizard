import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleEnqueue } from "./handle-enqueue";
import type { Env } from "./types";

function makeEnv(): Env {
  return {
    PLAYLIST_QUEUE: {
      send: vi.fn(),
      sendBatch: vi.fn().mockResolvedValue(undefined),
    } as unknown as Queue<never>,
    WORKER_SECRET: "secret",
    NEXT_APP_URL: "http://localhost:3000",
  };
}

function makeRequest(body: unknown, secret = "secret"): Request {
  return new Request("http://worker/enqueue", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
  });
}

describe("handleEnqueue", () => {
  let env: Env;

  beforeEach(() => {
    env = makeEnv();
  });

  it("認証失敗 → 401", async () => {
    const req = makeRequest({ messages: [] }, "wrong-secret");
    const res = await handleEnqueue(req, env);
    expect(res.status).toBe(401);
  });

  it("不正なボディ（messages が配列でない） → 400", async () => {
    const req = makeRequest({ messages: "not-array" });
    const res = await handleEnqueue(req, env);
    expect(res.status).toBe(400);
  });

  it("不正な JSON → 400", async () => {
    const req = new Request("http://worker/enqueue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer secret",
      },
      body: "invalid json",
    });
    const res = await handleEnqueue(req, env);
    expect(res.status).toBe(400);
  });

  it("正常系 → sendBatch を呼び 200 を返す", async () => {
    const messages = [
      {
        jobId: "job-1",
        opIndex: 0,
        type: "add-playlist-item",
        accId: "acc-1",
        playlistId: "pl-1",
        videoId: "vid-1",
      },
    ];
    const req = makeRequest({ messages });
    const res = await handleEnqueue(req, env);
    expect(res.status).toBe(200);
    expect(env.PLAYLIST_QUEUE.sendBatch).toHaveBeenCalledWith(
      messages.map((m) => ({ body: m })),
    );
  });
});
