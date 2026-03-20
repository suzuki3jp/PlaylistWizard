import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CommandInterface } from "./command";
import { CommandHistory } from "./history";

function createMockCommand(): CommandInterface {
  return {
    jobs: [],
    undo: vi.fn(),
  };
}

describe("CommandHistory", () => {
  let history: CommandHistory;

  beforeEach(() => {
    history = new CommandHistory();
  });

  describe("undoable", () => {
    it("should return false for initial state", () => {
      expect(history.undoable()).toBe(false);
    });

    it("should return true after addCommand", () => {
      history.addCommand(createMockCommand());
      expect(history.undoable()).toBe(true);
    });
  });

  describe("addCommand", () => {
    it("should return this for chaining", () => {
      const result = history.addCommand(createMockCommand());
      expect(result).toBe(history);
    });

    it("should allow chaining multiple addCommand calls", () => {
      const result = history
        .addCommand(createMockCommand())
        .addCommand(createMockCommand());
      expect(result).toBe(history);
    });
  });

  describe("undo", () => {
    it("should call undo on the current command", async () => {
      const command = createMockCommand();
      history.addCommand(command);
      await history.undo();
      expect(command.undo).toHaveBeenCalledOnce();
    });

    it("should do nothing when not undoable", async () => {
      // Should not throw
      await history.undo();
      expect(history.undoable()).toBe(false);
    });

    it("should decrement index after undo", async () => {
      history.addCommand(createMockCommand());
      expect(history.undoable()).toBe(true);
      await history.undo();
      expect(history.undoable()).toBe(false);
    });

    it("should undo the last command first when multiple commands exist", async () => {
      const command1 = createMockCommand();
      const command2 = createMockCommand();
      history.addCommand(command1).addCommand(command2);

      await history.undo();
      expect(command2.undo).toHaveBeenCalledOnce();
      expect(command1.undo).not.toHaveBeenCalled();

      await history.undo();
      expect(command1.undo).toHaveBeenCalledOnce();
    });

    it("should truncate forward history when new command is added after undo", async () => {
      const command1 = createMockCommand();
      const command2 = createMockCommand();
      const command3 = createMockCommand();

      history.addCommand(command1).addCommand(command2);
      await history.undo(); // undo command2

      history.addCommand(command3);
      await history.undo();
      // command3 should be undone, not command2
      expect(command3.undo).toHaveBeenCalledOnce();
      expect(command2.undo).toHaveBeenCalledOnce(); // from the first undo

      await history.undo();
      expect(command1.undo).toHaveBeenCalledOnce();

      // No more undo possible
      expect(history.undoable()).toBe(false);
    });
  });
});
