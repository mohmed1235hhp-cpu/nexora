import { db, notificationsTable } from "@workspace/db";
import { eq, and, gte } from "drizzle-orm";

const SMART_TIPS = [
  "💡 ماذا تفكر اليوم؟ دع Cyber AI يحول فكرتك إلى مشروع.",
  "🚀 هل لديك فكرة جديدة؟ اكتبها الآن وشوفها تتحقق.",
  "🎨 أنشئ صورة اليوم.",
  "🌐 أنشئ موقعاً جديداً.",
  "📱 اصنع تطبيقاً خلال دقائق.",
  "🏆 لا تنس المشاركة في مسابقات الأسبوع.",
  "⭐ ربما يكون مشروعك هو الفائز القادم.",
  "🔥 المجتمع ينتظر مشروعك الجديد.",
];

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Sends today's rotating tip to the user if (and only if) they haven't
 * already received one today. Safe to call on every notifications-list
 * fetch — it's a no-op after the first call of the day.
 */
export async function maybeSendDailyTip(userId: number): Promise<void> {
  const already = await db.select().from(notificationsTable)
    .where(and(
      eq(notificationsTable.userId, userId),
      eq(notificationsTable.type, "smart_tip"),
      gte(notificationsTable.createdAt, startOfToday()),
    ))
    .limit(1);

  if (already.length) return;

  const message = SMART_TIPS[dayOfYear(new Date()) % SMART_TIPS.length];
  await db.insert(notificationsTable).values({
    userId,
    type: "smart_tip",
    message,
  });
}
