import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { queueRepository } = await import("./repository");

describe("QueueRepository.enqueue", () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.CLOUDFLARE_WORKER_URL = "https://worker.example.com";
    process.env.WORKER_SECRET = "test-secret";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.CLOUDFLARE_WORKER_URL = originalEnv.CLOUDFLARE_WORKER_URL;
    process.env.WORKER_SECRET = originalEnv.WORKER_SECRET;
  });

  it("throws when CLOUDFLARE_WORKER_URL is not set", async () => {
    delete process.env.CLOUDFLARE_WORKER_URL;
    await expect(queueRepository.enqueue([])).rejects.toThrow(
      "Queue is not configured",
    );
  });

  it("throws when WORKER_SECRET is not set", async () => {
    delete process.env.WORKER_SECRET;
    await expect(queueRepository.enqueue([])).rejects.toThrow(
      "Queue is not configured",
    );
  });

  it("calls the relay worker endpoint with correct headers and body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    const messages = [
      {
        jobId: "job-1",
        opIndex: 0,
        type: "create-playlist" as const,
        accId: "acc-1",
        title: "Test",
        privacy: "private" as const,
      },
    ];

    await queueRepository.enqueue(messages);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://worker.example.com/enqueue",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-secret",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ messages }),
      }),
    );
  });

  it("throws when fetch returns non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(queueRepository.enqueue([])).rejects.toThrow(
      "Failed to enqueue messages",
    );
  });
});
