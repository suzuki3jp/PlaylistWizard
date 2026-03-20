import { describe, expect, it, vi } from "vitest";
import { FeedbackDbRepository } from "./repository";

describe("FeedbackDbRepository", () => {
  describe("insert", () => {
    it("calls db.insert with all provided fields", async () => {
      const valuesMock = vi.fn().mockResolvedValue(undefined);
      const db = {
        insert: vi.fn().mockReturnValue({ values: valuesMock }),
      } as never;
      const repo = new FeedbackDbRepository(db);

      await repo.insert({
        userId: "user-1",
        category: "bug",
        title: "Test bug",
        message: "Something broke",
        email: "test@example.com",
        browser: "Chrome",
        pageUrl: "https://example.com",
      });

      expect(db.insert).toHaveBeenCalledOnce();
      expect(valuesMock).toHaveBeenCalledOnce();

      const calledWith = valuesMock.mock.calls[0][0];
      expect(calledWith.userId).toBe("user-1");
      expect(calledWith.category).toBe("bug");
      expect(calledWith.title).toBe("Test bug");
      expect(calledWith.message).toBe("Something broke");
      expect(calledWith.email).toBe("test@example.com");
      expect(calledWith.browser).toBe("Chrome");
      expect(calledWith.pageUrl).toBe("https://example.com");
      expect(typeof calledWith.id).toBe("string");
      expect(calledWith.createdAt).toBeInstanceOf(Date);
    });

    it("uses null for optional fields when not provided", async () => {
      const valuesMock = vi.fn().mockResolvedValue(undefined);
      const db = {
        insert: vi.fn().mockReturnValue({ values: valuesMock }),
      } as never;
      const repo = new FeedbackDbRepository(db);

      await repo.insert({
        userId: "user-1",
        category: "feature",
        title: "New feature",
        message: "Please add X",
      });

      const calledWith = valuesMock.mock.calls[0][0];
      expect(calledWith.email).toBeNull();
      expect(calledWith.browser).toBeNull();
      expect(calledWith.pageUrl).toBeNull();
    });

    it("propagates db error", async () => {
      const db = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      } as never;
      const repo = new FeedbackDbRepository(db);

      await expect(
        repo.insert({ userId: "u", category: "bug", title: "t", message: "m" }),
      ).rejects.toThrow("DB error");
    });
  });
});
