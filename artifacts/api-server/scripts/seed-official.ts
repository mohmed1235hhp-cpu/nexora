/**
 * Seeds the official "Cyber AI Official" account and "Cyber AI Community" group.
 * Run once after migrations, manually:
 *
 *   pnpm --filter @workspace/api-server exec tsx scripts/seed-official.ts
 *
 * Safe to re-run — it upserts by username/name instead of duplicating.
 * The account password is random and unknown to anyone; if the team needs
 * to actually log in as this account, use the password-reset flow with its
 * email instead of relying on the seed script's generated password.
 */
import { db, usersTable, groupsTable, groupMembersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "../src/lib/password";
import crypto from "crypto";

const OFFICIAL_USERNAME = "cyberai_official";
const OFFICIAL_EMAIL = "official@cyberai.local";
const OFFICIAL_DISPLAY_NAME = "Cyber AI Official";
const OFFICIAL_GROUP_NAME = "Cyber AI Community";

async function seedOfficialAccount(): Promise<number> {
  const existing = await db.select().from(usersTable).where(eq(usersTable.username, OFFICIAL_USERNAME)).limit(1);
  if (existing.length) {
    console.log("Official account already exists, skipping creation.");
    return existing[0].id;
  }

  const passwordHash = await hashPassword(crypto.randomBytes(32).toString("hex"));
  const [user] = await db.insert(usersTable).values({
    username: OFFICIAL_USERNAME,
    email: OFFICIAL_EMAIL,
    passwordHash,
    displayName: OFFICIAL_DISPLAY_NAME,
    bio: "الحساب الرسمي لتطبيق Cyber AI — تحديثات، أخبار، ومسابقات الأسبوع.",
    isVerified: true,
    isOfficial: true,
    isProtected: true,
  }).returning();

  console.log(`Created official account: @${user.username} (id ${user.id})`);
  return user.id;
}

async function seedOfficialGroup(ownerId: number): Promise<void> {
  const existing = await db.select().from(groupsTable).where(eq(groupsTable.name, OFFICIAL_GROUP_NAME)).limit(1);
  if (existing.length) {
    console.log("Official group already exists, skipping creation.");
    return;
  }

  const [group] = await db.insert(groupsTable).values({
    name: OFFICIAL_GROUP_NAME,
    description: "المجتمع الرسمي لتطبيق Cyber AI.",
    category: "رسمي",
    privacy: "public",
    isOfficial: true,
    isPinned: true,
    isDeletable: false,
    createdBy: ownerId,
    membersCount: 1,
  }).returning();

  await db.insert(groupMembersTable).values({ groupId: group.id, userId: ownerId, role: "owner" });
  console.log(`Created official group: ${group.name} (id ${group.id})`);
}

async function main() {
  const ownerId = await seedOfficialAccount();
  await seedOfficialGroup(ownerId);
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
