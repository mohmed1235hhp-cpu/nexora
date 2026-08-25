import { pgTable, text, serial, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "moderator", "support", "super_admin"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  coverUrl: text("cover_url"),
  specialization: text("specialization"),
  country: text("country"),
  language: text("language"),
  website: text("website"),
  github: text("github"),
  linkedin: text("linkedin"),
  portfolio: text("portfolio"),
  role: userRoleEnum("role").notNull().default("user"),
  level: integer("level").notNull().default(1),
  reputationScore: integer("reputation_score").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  // Official "Cyber AI Official" account: shows the verified badge, is pinned
  // first in search, and is protected from rename/delete — see users.ts guards.
  // Its follower count is intentionally never exposed (isOfficial hides it).
  isOfficial: boolean("is_official").notNull().default(false),
  isProtected: boolean("is_protected").notNull().default(false),
  isFeaturedCreator: boolean("is_featured_creator").notNull().default(false),
  followersCount: integer("followers_count").notNull().default(0),
  followingCount: integer("following_count").notNull().default(0),
  friendsCount: integer("friends_count").notNull().default(0),
  portfolioCount: integer("portfolio_count").notNull().default(0),
  likesCount: integer("likes_count").notNull().default(0),
  viewsCount: integer("views_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const userSkillsTable = pgTable("user_skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  skill: text("skill").notNull(),
});

export const userAiToolsTable = pgTable("user_ai_tools", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tool: text("tool").notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true, createdAt: true, updatedAt: true,
  followersCount: true, followingCount: true, friendsCount: true,
  portfolioCount: true, likesCount: true, viewsCount: true,
  level: true, reputationScore: true, isVerified: true, isBanned: true,
  isOfficial: true, isProtected: true, isFeaturedCreator: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
