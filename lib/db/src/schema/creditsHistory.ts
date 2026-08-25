import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const creditsHistoryTable = pgTable("credits_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  toolName: text("tool_name").notNull(),
  toolLabel: text("tool_label").notNull(),
  creditsUsed: integer("credits_used").notNull(),
  prompt: text("prompt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCreditsHistorySchema = createInsertSchema(creditsHistoryTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCreditsHistory = z.infer<typeof insertCreditsHistorySchema>;
export type CreditsHistory = typeof creditsHistoryTable.$inferSelect;
