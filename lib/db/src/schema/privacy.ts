import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const privacySettingsTable = pgTable("privacy_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  profileVisibility: text("profile_visibility").notNull().default("public"),
  portfolioVisibility: text("portfolio_visibility").notNull().default("public"),
  storiesVisibility: text("stories_visibility").notNull().default("public"),
  showOnlineStatus: boolean("show_online_status").notNull().default(true),
  showLastSeen: boolean("show_last_seen").notNull().default(true),
  allowFriendRequests: boolean("allow_friend_requests").notNull().default(true),
  allowMessages: text("allow_messages").notNull().default("friends"),
  showFriendsList: boolean("show_friends_list").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type PrivacySettings = typeof privacySettingsTable.$inferSelect;
