import { describe, expect, it, vi } from "vitest";

import { Logger, type LoggerTransport } from "./index";

describe("Logger", () => {
  it("should create a logger with default transport and level", () => {
    const logger = new Logger({ name: "test" });
    expect(logger.name).toBe("test");
    expect(logger.transport).toBe(console);
    expect(logger.level).toBe("info");
  });

  it("should create a child logger with inherited transport and level", () => {
    const parentLogger = new Logger({ name: "parent" });
    const childLogger = parentLogger.makeChild("child");
    expect(childLogger.name).toBe("child");
    expect(childLogger.transport).toBe(parentLogger.transport);
    expect(childLogger.level).toBe(parentLogger.level);
  });

  it("should log messages at the correct level", () => {
    const mockTransport: LoggerTransport = {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };
    const logger = new Logger({
      name: "test",
      transport: mockTransport,
      level: "debug",
    });

    logger.debug("Debug message");
    logger.info("Info message");
    logger.error("Error message");

    expect(mockTransport.debug).toHaveBeenCalledWith("[test] Debug message");
    expect(mockTransport.info).toHaveBeenCalledWith("[test] Info message");
    expect(mockTransport.error).toHaveBeenCalledWith("[test] Error message");
  });

  it("should not log messages below the current level", () => {
    const mockTransport: LoggerTransport = {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };
    const logger = new Logger({
      name: "test",
      transport: mockTransport,
      level: "error",
    });

    logger.debug("Debug message");
    logger.info("Info message");

    expect(mockTransport.debug).not.toHaveBeenCalled();
    expect(mockTransport.info).not.toHaveBeenCalled();
  });

  it("should log correctly formatted loggers with parent names", () => {
    const mockTransport: LoggerTransport = {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };
    const parentLogger = new Logger({
      name: "parent",
      transport: mockTransport,
      level: "debug",
    });
    const childLogger = parentLogger.makeChild("child");

    childLogger.debug("Debug message");
    childLogger.info("Info message");
    childLogger.error("Error message");

    expect(mockTransport.debug).toHaveBeenCalledWith(
      "[parent/child] Debug message",
    );
    expect(mockTransport.info).toHaveBeenCalledWith(
      "[parent/child] Info message",
    );
    expect(mockTransport.error).toHaveBeenCalledWith(
      "[parent/child] Error message",
    );
  });

  it("should log correctly formatted loggers with grandparent names", () => {
    const mockTransport: LoggerTransport = {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };
    const grandparentLogger = new Logger({
      name: "grandparent",
      transport: mockTransport,
      level: "debug",
    });
    const parentLogger = grandparentLogger.makeChild("parent");
    const childLogger = parentLogger.makeChild("child");

    childLogger.debug("Debug message");
    childLogger.info("Info message");
    childLogger.error("Error message");

    expect(mockTransport.debug).toHaveBeenCalledWith(
      "[grandparent/parent/child] Debug message",
    );
    expect(mockTransport.info).toHaveBeenCalledWith(
      "[grandparent/parent/child] Info message",
    );
    expect(mockTransport.error).toHaveBeenCalledWith(
      "[grandparent/parent/child] Error message",
    );
  });

  it("should handle multiple messages in a single log call", () => {
    const mockTransport: LoggerTransport = {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };
    const logger = new Logger({
      name: "test",
      transport: mockTransport,
      level: "debug",
    });

    logger.debug("Message 1", "Message 2");
    logger.info("Info 1", "Info 2");
    logger.error("Error 1", "Error 2");

    expect(mockTransport.debug).toHaveBeenCalledWith(
      "[test] Message 1 Message 2",
    );
    expect(mockTransport.info).toHaveBeenCalledWith("[test] Info 1 Info 2");
    expect(mockTransport.error).toHaveBeenCalledWith("[test] Error 1 Error 2");
  });

  it("should handle multiple type of messages in a single log call", () => {
    const mockTransport: LoggerTransport = {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };
    const logger = new Logger({
      name: "test",
      transport: mockTransport,
      level: "debug",
    });

    const obj = { key: "value" };
    logger.debug("Message 1", obj);

    expect(mockTransport.debug).toHaveBeenCalledWith(
      `[test] Message 1 { "key":"value" }`,
    );
  });
});
