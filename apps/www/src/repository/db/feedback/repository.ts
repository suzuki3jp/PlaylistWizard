import { db as dbInstance } from "@/lib/db";
import { feedback } from "@/lib/db/schema";

type Db = typeof dbInstance;

export class FeedbackDbRepository {
  constructor(private db: Db) {}

  async insert(data: {
    userId: string;
    category: string;
    title: string;
    message: string;
    email?: string | null;
    browser?: string | null;
    pageUrl?: string | null;
  }): Promise<void> {
    await this.db.insert(feedback).values({
      id: crypto.randomUUID(),
      userId: data.userId,
      category: data.category,
      title: data.title,
      message: data.message,
      email: data.email ?? null,
      browser: data.browser ?? null,
      pageUrl: data.pageUrl ?? null,
      createdAt: new Date(),
    });
  }
}

export const feedbackDbRepository = new FeedbackDbRepository(dbInstance);
