import { describe, expect, it, vi } from "vitest";

import { Command } from "./command";
import type { JobInterface } from "./jobs";

function createMockJob(): JobInterface {
  return {
    redo: vi.fn().mockResolvedValue(undefined),
    undo: vi.fn().mockResolvedValue(undefined),
  };
}

describe("Command", () => {
  it("should call redo on all jobs", async () => {
    const job1 = createMockJob();
    const job2 = createMockJob();
    const command = new Command([job1, job2]);

    await command.redo();

    expect(job1.redo).toHaveBeenCalledTimes(1);
    expect(job2.redo).toHaveBeenCalledTimes(1);
  });

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

    await expect(command.redo()).resolves.toBeUndefined();
    await expect(command.undo()).resolves.toBeUndefined();
  });

  it("should call redo and undo in order", async () => {
    const calls: string[] = [];
    const job1 = {
      redo: vi.fn().mockImplementation(async () => {
        calls.push("job1-redo");
      }),
      undo: vi.fn().mockImplementation(async () => {
        calls.push("job1-undo");
      }),
    };
    const job2 = {
      redo: vi.fn().mockImplementation(async () => {
        calls.push("job2-redo");
      }),
      undo: vi.fn().mockImplementation(async () => {
        calls.push("job2-undo");
      }),
    };

    const command = new Command([job1, job2]);
    await command.redo();
    await command.undo();

    expect(calls).toEqual(["job1-redo", "job2-redo", "job2-undo", "job1-undo"]);
  });
});
