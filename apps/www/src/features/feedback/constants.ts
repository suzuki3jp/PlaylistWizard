export const FEEDBACK_CATEGORY_CONFIG = {
  bug_report: {
    discordColor: 0xe74c3c,
    discordLabel: "Bug Report",
  },
  feature_request: {
    discordColor: 0x2ecc71,
    discordLabel: "Feature Request",
  },
  other: {
    discordColor: 0x95a5a6,
    discordLabel: "Other",
  },
} as const;

export type FeedbackCategory = keyof typeof FEEDBACK_CATEGORY_CONFIG;
export const FEEDBACK_CATEGORIES = Object.keys(
  FEEDBACK_CATEGORY_CONFIG,
) as FeedbackCategory[];
