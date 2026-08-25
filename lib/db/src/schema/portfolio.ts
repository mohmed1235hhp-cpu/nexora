import { pgTable, text, serial, timestamp, integer, boolean, real, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const portfolioTypeEnum = pgEnum("portfolio_type", ["image", "website", "app", "video", "article"]);

export const portfolioItemsTable = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: portfolioTypeEnum("type").notNull(),
  url: text("url"),
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  category: text("category"),
  viewsCount: integer("views_count").notNull().default(0),
  likesCount: integer("likes_count").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  sharesCount: integer("shares_count").notNull().default(0),
  rating: real("rating").notNull().default(0),
  isPinned: boolean("is_pinned").notNull().default(false),
  // Admin-curated "Featured" section — see admin.ts feature/unfeature routes.
  isFeatured: boolean("is_featured").notNull().default(false),
  isPublic: boolean("is_public").notNull().default(true),
  // Column already existed at the DB level since migration 0004 but was
  // never modeled here, so nothing ever read or wrote it — DELETE hard-
  // deleted regardless. Wired up now: DELETE sets this instead of removing
  // the row, and every read path filters it out (see portfolio.ts, search.ts).
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const portfolioTagsTable = pgTable("portfolio_tags", {
  id: serial("id").primaryKey(),
  portfolioItemId: integer("portfolio_item_id").notNull().references(() => portfolioItemsTable.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
});

export const portfolioLikesTable = pgTable("portfolio_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  portfolioItemId: integer("portfolio_item_id").notNull().references(() => portfolioItemsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // See migrations/0009_unique_likes_saves.sql — enforced at the DB level so
  // the toggle-like route can rely on onConflictDoNothing for atomicity.
  uniqueIndex("uq_portfolio_likes_user_item").on(t.userId, t.portfolioItemId),
]);

export const portfolioSavesTable = pgTable("portfolio_saves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  portfolioItemId: integer("portfolio_item_id").notNull().references(() => portfolioItemsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("uq_portfolio_saves_user_item").on(t.userId, t.portfolioItemId),
]);

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  portfolioItemId: integer("portfolio_item_id").notNull().references(() => portfolioItemsTable.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  likesCount: integer("likes_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPortfolioItemSchema = createInsertSchema(portfolioItemsTable).omit({
  id: true, createdAt: true, updatedAt: true,
  viewsCount: true, likesCount: true, commentsCount: true, sharesCount: true, rating: true,
  isPinned: true, isFeatured: true,
});

export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type PortfolioItem = typeof portfolioItemsTable.$inferSelect;
export type Comment = typeof commentsTable.$inferSelect;
