import { pgTable, text, serial, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
  "message", "friend_request", "friend_accept", "follow", "like",
  "comment", "story_like", "story_view", "portfolio_share",
  "smart_tip", "group_invite", "group_post",
  "contest_start", "contest_ending", "contest_winner", "contest_result",
]);

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  actorId: integer("actor_id").references(() => usersTable.id, { onDelete: "set null" }),
  type: notificationTypeEnum("type").notNull(),
  resourceId: integer("resource_id"),
  resourceType: text("resource_type"),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
