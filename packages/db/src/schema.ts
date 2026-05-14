import type { StructuredPlaylistsDefinition } from "@playlistwizard/core/structured-playlists";
import type {
  JobStatus,
  JobType,
  StepStatus,
  StepType,
} from "@playlistwizard/playlist-action-job";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  isDeveloper: boolean("is_developer").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const structuredPlaylistsDefinition = pgTable(
  "structured_playlists_definition",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accId: text("acc_id").notNull(),
    definition: jsonb("definition")
      .$type<StructuredPlaylistsDefinition>()
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.accId] })],
);

export const feedback = pgTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    title: text("title").notNull().default(""),
    message: text("message").notNull(),
    email: text("email"),
    browser: text("browser"),
    pageUrl: text("page_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("feedback_userId_idx").on(table.userId)],
);

export const pinnedPlaylists = pgTable(
  "pinned_playlists",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    playlistId: text("playlist_id").notNull(),
    provider: text("provider").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("pinned_playlists_unique_idx").on(
      t.userId,
      t.accountId,
      t.playlistId,
    ),
    index("pinned_playlists_userId_idx").on(t.userId),
  ],
);

export const featureFlagEnabledUsers = pgTable(
  "feature_flag_enabled_users",
  {
    id: text("id").primaryKey(),
    flagName: text("flag_name").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("feature_flag_enabled_users_unique_idx").on(
      t.flagName,
      t.userId,
    ),
    index("feature_flag_enabled_users_userId_idx").on(t.userId),
  ],
);

export const job = pgTable(
  "job",
  {
    id: text("id").primaryKey(),
    type: text("type").$type<JobType>().notNull(),
    status: text("status").$type<JobStatus>().notNull().default("Pending"),
    completeSteps: integer("complete_steps").notNull().default(0),
    totalSteps: integer("total_steps").notNull().default(0),
    dismissed: boolean("dismissed").notNull().default(false),
    error: jsonb("error"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("job_userId_idx").on(t.userId)],
);

export const step = pgTable(
  "step",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => job.id, { onDelete: "cascade" }),
    type: text("type").$type<StepType>().notNull(),
    status: text("status").$type<StepStatus>().notNull().default("Pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    payload: jsonb("payload").notNull(),
    lastError: text("last_error"),
    failedAt: timestamp("failed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("step_jobId_idx").on(t.jobId)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  structuredPlaylistsDefinitions: many(structuredPlaylistsDefinition),
  feedbacks: many(feedback),
  pinnedPlaylists: many(pinnedPlaylists),
  featureFlagEnabledUsers: many(featureFlagEnabledUsers),
  jobs: many(job),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const structuredPlaylistsDefinitionRelations = relations(
  structuredPlaylistsDefinition,
  ({ one }) => ({
    user: one(user, {
      fields: [structuredPlaylistsDefinition.userId],
      references: [user.id],
    }),
  }),
);

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(user, {
    fields: [feedback.userId],
    references: [user.id],
  }),
}));

export const pinnedPlaylistsRelations = relations(
  pinnedPlaylists,
  ({ one }) => ({
    user: one(user, {
      fields: [pinnedPlaylists.userId],
      references: [user.id],
    }),
  }),
);

export const featureFlagEnabledUsersRelations = relations(
  featureFlagEnabledUsers,
  ({ one }) => ({
    user: one(user, {
      fields: [featureFlagEnabledUsers.userId],
      references: [user.id],
    }),
  }),
);

export const jobRelations = relations(job, ({ one, many }) => ({
  user: one(user, { fields: [job.userId], references: [user.id] }),
  steps: many(step),
}));

export const stepRelations = relations(step, ({ one }) => ({
  job: one(job, { fields: [step.jobId], references: [job.id] }),
}));
