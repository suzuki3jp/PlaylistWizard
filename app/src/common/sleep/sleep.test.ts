import { describe, expect, it, vi } from "vitest";

import { sleep } from "@/common/sleep";

describe("sleep", () => {
  it("should wait for the specified time", async () => {
    const startTime = Date.now();
    const waitTime = 100;

    await sleep(waitTime);

    const endTime = Date.now();
    const elapsed = endTime - startTime;

    const toleranceRate = 0.98; // 10% tolerance

    expect(elapsed).toBeGreaterThanOrEqual(waitTime * toleranceRate);
  });

  it("should resolve after timeout", async () => {
    vi.useFakeTimers();

    const promise = sleep(1000);
    vi.advanceTimersByTime(1000);

    await promise;

    vi.useRealTimers();
  });
});
