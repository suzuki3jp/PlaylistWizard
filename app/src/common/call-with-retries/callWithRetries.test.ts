import { describe, expect, it, vi } from "vitest";
import { type CallWithRetriesOptions, callWithRetries } from "./index";

describe("callWithRetries", () => {
  it("should resolve if the function succeeds on the first try", async () => {
    const func = vi.fn().mockResolvedValue({ status: 200, message: "success" });
    const result = await callWithRetries({ func, maxRetries: 3 });
    expect(result).toStrictEqual({ status: 200, message: "success" });
    expect(func).toHaveBeenCalledTimes(1);
  });

  it("should retry the specified number of times on failure", async () => {
    const func = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail1"))
      .mockRejectedValueOnce(new Error("fail2"))
      .mockResolvedValue("final success");
    const result = await callWithRetries({ func, maxRetries: 3 });
    expect(result).toBe("final success");
    expect(func).toHaveBeenCalledTimes(4); // initial + 3 retries
  });

  it("should throw if all retries fail", async () => {
    const func = vi.fn().mockRejectedValue(new Error("always fails"));
    await expect(callWithRetries({ func, maxRetries: 2 })).rejects.toThrow(
      "always fails",
    );
    expect(func).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("should pass arguments to the function", async () => {
    const func = vi.fn().mockResolvedValue("done");
    await callWithRetries({ func, maxRetries: 1 }, "arg1", 42);
    expect(func).toHaveBeenCalledWith("arg1", 42);
  });
});
