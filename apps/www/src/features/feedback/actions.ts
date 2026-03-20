"use server";

import { headers } from "next/headers";
import { toUserId } from "@/entities/ids";
import { auth } from "@/lib/auth";
import { feedbackDbRepository } from "@/repository/db/feedback/repository";
import { FEEDBACK_CATEGORY_CONFIG, type FeedbackCategory } from "./constants";

export async function submitFeedback(data: {
  category: FeedbackCategory;
  title: string;
  message: string;
  email?: string;
  browser?: string;
  pageUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  await feedbackDbRepository.insert({
    userId: toUserId(session.user.id),
    category: data.category,
    title: data.title,
    message: data.message,
    email: data.email,
    browser: data.browser,
    pageUrl: data.pageUrl,
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
              { name: "Title", value: data.title ?? "N/A" },
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
