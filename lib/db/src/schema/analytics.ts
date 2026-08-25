import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const pageViewsTable = pgTable("page_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  page: text("page").notNull(),
  referrer: text("referrer"),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userEventsTable = pgTable("user_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  event: text("event").notNull(),
  resourceType: text("resource_type"),
  resourceId: integer("resource_id"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userInterestsTable = pgTable("user_interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  weight: real("weight").notNull().default(1.0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const dailyMetricsTable = pgTable("daily_metrics", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  dau: integer("dau").notNull().default(0),
  newUsers: integer("new_users").notNull().default(0),
  totalPosts: integer("total_posts").notNull().default(0),
  totalLikes: integer("total_likes").notNull().default(0),
  totalComments: integer("total_comments").notNull().default(0),
  totalStories: integer("total_stories").notNull().default(0),
  avgSessionDuration: real("avg_session_duration").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PageView = typeof pageViewsTable.$inferSelect;
export type UserEvent = typeof userEventsTable.$inferSelect;
export type UserInterest = typeof userInterestsTable.$inferSelect;
export type DailyMetric = typeof dailyMetricsTable.$inferSelect;
