import { pgTable, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const mutesTable = pgTable("mutes", {
  id: serial("id").primaryKey(),
  muterId: integer("muter_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  mutedId: integer("muted_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Mute = typeof mutesTable.$inferSelect;
