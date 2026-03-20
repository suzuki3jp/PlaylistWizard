import { describe, expect, it, vi } from "vitest";

import { Command } from "./command";
import type { JobInterface } from "./jobs";

function createMockJob(): JobInterface {
  return {
    undo: vi.fn().mockResolvedValue(undefined),
  };
}

describe("Command", () => {
  it("should call undo on all jobs", async () => {
    const job1 = createMockJob();
    const job2 = createMockJob();
    const command = new Command([job1, job2]);

    await command.undo();

    expect(job1.undo).toHaveBeenCalledTimes(1);
    expect(job2.undo).toHaveBeenCalledTimes(1);
  });

  it("should handle empty jobs array", async () => {
    const command = new Command([]);

    await expect(command.undo()).resolves.toBeUndefined();
  });

  it("should call undo in order", async () => {
    const calls: string[] = [];
    const job1 = {
      undo: vi.fn().mockImplementation(async () => {
        calls.push("job1-undo");
      }),
    };
    const job2 = {
      undo: vi.fn().mockImplementation(async () => {
        calls.push("job2-undo");
      }),
    };

    const command = new Command([job1, job2]);
    await command.undo();

    expect(calls).toEqual(["job2-undo", "job1-undo"]);
  });
});
