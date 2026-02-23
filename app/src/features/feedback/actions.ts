"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedback } from "@/lib/db/schema";
import { FEEDBACK_CATEGORY_CONFIG, type FeedbackCategory } from "./constants";

export async function submitFeedback(data: {
  category: FeedbackCategory;
  message: string;
  email?: string;
  browser?: string;
  pageUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  await db.insert(feedback).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    category: data.category,
    message: data.message,
    email: data.email ?? null,
    browser: data.browser ?? null,
    pageUrl: data.pageUrl ?? null,
    createdAt: new Date(),
  });

  const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;
  if (webhookUrl) {
    const config = FEEDBACK_CATEGORY_CONFIG[data.category];
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "New Feedback",
            color: config.discordColor,
            fields: [
              {
                name: "Category",
                value: config.discordLabel,
                inline: true,
              },
              {
                name: "Email",
                value: data.email ?? "N/A",
                inline: true,
              },
              { name: "Message", value: data.message },
              { name: "Page URL", value: data.pageUrl ?? "N/A" },
              { name: "Browser", value: data.browser ?? "N/A" },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: `User ID: ${session.user.id}` },
          },
        ],
      }),
    });
  }

  return { success: true };
}
