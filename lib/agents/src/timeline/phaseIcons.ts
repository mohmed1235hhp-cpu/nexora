import type { TimelinePhase } from "../types/timeline.types";

export const phaseIcons: Record<TimelinePhase, string> = {
  "analyzing": "🧠",
  "planning": "📋",
  "researching": "🔍",
  "designing": "🏗",
  "coding": "💻",
  "file-operations": "📂",
  "image-processing": "🖼",
  "voice-processing": "🎤",
  "testing": "🧪",
  "reviewing": "🔎",
  "debugging": "🛠",
  "building": "📦",
  "preparing": "🚀",
  "deploying": "🌐",
  "reporting": "📄",
  "completed": "✅",
};

export const phaseLabels: Record<TimelinePhase, string> = {
  "analyzing": "تحليل الطلب",
  "planning": "إنشاء الخطة",
  "researching": "البحث",
  "designing": "تصميم الحل",
  "coding": "كتابة الكود",
  "file-operations": "تعديل الملفات",
  "image-processing": "إنشاء الصور",
  "voice-processing": "معالجة الصوت",
  "testing": "تشغيل الاختبارات",
  "reviewing": "مراجعة الكود",
  "debugging": "إصلاح الأخطاء",
  "building": "Build",
  "preparing": "تجهيز المشروع",
  "deploying": "إنشاء الرابط",
  "reporting": "إنشاء التقرير",
  "completed": "انتهت المهمة",
};
