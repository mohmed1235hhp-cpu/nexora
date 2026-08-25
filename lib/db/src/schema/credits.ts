import { pgTable, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const userPlanEnum = pgEnum("user_plan", ["free", "premium", "pro"]);

export const userCreditsTable = pgTable("user_credits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  balance: integer("balance").notNull().default(100),
  // Subscription tier — drives feature limits such as daily video-generation
  // caps (see artifacts/api-server/src/lib/videoLimits.ts). Free by default;
  // upgraded by whatever billing flow completes a subscription purchase.
  plan: userPlanEnum("plan").notNull().default("free"),
  lastResetAt: timestamp("last_reset_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserCreditsSchema = createInsertSchema(userCreditsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertUserCredits = z.infer<typeof insertUserCreditsSchema>;
export type UserCredits = typeof userCreditsTable.$inferSelect;
