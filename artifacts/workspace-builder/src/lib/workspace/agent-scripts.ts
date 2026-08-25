// Dynamic script generation for the premium AI workspace timeline.
// Detects the type of request and returns contextual step/agent flows.

export type RequestKind =
  | "website"
  | "app"
  | "image"
  | "search"
  | "voice"
  | "content"
  | "code"
  | "general";

export interface TimelineStep {
  icon: string;
  label: string;
  labelAr: string;
  agent: string;
  durationMs: number;
}

const AR_HINT = /[\u0600-\u06FF]/;

export function detectKind(input: string): RequestKind {
  const t = input.toLowerCase();
  if (/(website|landing|موقع|صفحة)/i.test(t)) return "website";
  if (/(app|application|mobile|تطبيق)/i.test(t)) return "app";
  if (/(image|picture|logo|photo|صورة|شعار)/i.test(t)) return "image";
  if (/(search|find|ابحث|بحث)/i.test(t)) return "search";
  if (/(voice|speak|audio|صوت|تكلم)/i.test(t)) return "voice";
  if (/(article|blog|write|content|مقال|محتوى|اكتب)/i.test(t)) return "content";
  if (/(code|api|function|كود|برمج)/i.test(t)) return "code";
  return "general";
}

export function isArabic(input: string): boolean {
  return AR_HINT.test(input);
}

const BASE_START: TimelineStep[] = [
  { icon: "🧠", label: "Understanding your idea", labelAr: "نفهم فكرتك", agent: "Planner AI", durationMs: 900 },
  { icon: "📋", label: "Building execution plan", labelAr: "نبني خطة التنفيذ", agent: "Planner AI", durationMs: 1000 },
];

const BASE_END: TimelineStep[] = [
  { icon: "⚡", label: "Optimizing performance", labelAr: "تحسين الأداء", agent: "Performance AI", durationMs: 900 },
  { icon: "🛡", label: "Reviewing quality", labelAr: "مراجعة الجودة", agent: "QA AI", durationMs: 900 },
  { icon: "🔒", label: "Security inspection", labelAr: "فحص الأمان", agent: "Security AI", durationMs: 700 },
  { icon: "📦", label: "Preparing final project", labelAr: "تجهيز المشروع النهائي", agent: "Project AI", durationMs: 700 },
  { icon: "✅", label: "Project completed successfully", labelAr: "تم إنجاز المشروع بنجاح", agent: "Orchestrator", durationMs: 400 },
];

const MIDDLE: Record<RequestKind, TimelineStep[]> = {
  website: [
    { icon: "🎨", label: "Designing interface", labelAr: "تصميم الواجهة", agent: "Website AI", durationMs: 1100 },
    { icon: "🖼", label: "Creating custom images", labelAr: "توليد الصور المخصصة", agent: "Image AI", durationMs: 1200 },
    { icon: "✍", label: "Writing professional content", labelAr: "كتابة المحتوى", agent: "Content AI", durationMs: 1000 },
    { icon: "💻", label: "Building your website", labelAr: "بناء موقعك", agent: "Website AI", durationMs: 1200 },
  ],
  app: [
    { icon: "📐", label: "Designing app architecture", labelAr: "تصميم بنية التطبيق", agent: "App AI", durationMs: 1100 },
    { icon: "🎨", label: "Crafting mobile UI", labelAr: "تصميم واجهة الموبايل", agent: "App AI", durationMs: 1100 },
    { icon: "💻", label: "Generating app code", labelAr: "توليد كود التطبيق", agent: "Code AI", durationMs: 1300 },
    { icon: "🔌", label: "Wiring integrations", labelAr: "ربط التكاملات", agent: "App AI", durationMs: 900 },
  ],
  image: [
    { icon: "🎨", label: "Composing scene", labelAr: "تركيب المشهد", agent: "Image AI", durationMs: 900 },
    { icon: "🖼", label: "Rendering high-resolution image", labelAr: "توليد صورة عالية الدقة", agent: "Image AI", durationMs: 1500 },
    { icon: "🪄", label: "Refining details", labelAr: "تحسين التفاصيل", agent: "Image AI", durationMs: 900 },
  ],
  search: [
    { icon: "🔎", label: "Scanning trusted sources", labelAr: "فحص المصادر الموثوقة", agent: "Search AI", durationMs: 1000 },
    { icon: "📚", label: "Reading and summarizing", labelAr: "قراءة وتلخيص", agent: "Search AI", durationMs: 1200 },
    { icon: "🧩", label: "Synthesizing findings", labelAr: "دمج النتائج", agent: "Content AI", durationMs: 900 },
  ],
  voice: [
    { icon: "🎙", label: "Preparing voice pipeline", labelAr: "تجهيز نظام الصوت", agent: "Voice AI", durationMs: 900 },
    { icon: "🗣", label: "Generating natural voice", labelAr: "توليد صوت طبيعي", agent: "Voice AI", durationMs: 1400 },
    { icon: "🎚", label: "Mastering audio", labelAr: "معالجة الصوت", agent: "Voice AI", durationMs: 800 },
  ],
  content: [
    { icon: "📝", label: "Outlining the piece", labelAr: "تجهيز المخطط", agent: "Content AI", durationMs: 900 },
    { icon: "✍", label: "Writing professional content", labelAr: "كتابة محتوى احترافي", agent: "Content AI", durationMs: 1500 },
    { icon: "🔍", label: "Fact-checking", labelAr: "التحقق من الحقائق", agent: "Search AI", durationMs: 900 },
  ],
  code: [
    { icon: "🧱", label: "Designing modules", labelAr: "تصميم الوحدات", agent: "Code AI", durationMs: 900 },
    { icon: "💻", label: "Writing production code", labelAr: "كتابة الكود", agent: "Code AI", durationMs: 1500 },
    { icon: "🧪", label: "Running tests", labelAr: "تشغيل الاختبارات", agent: "QA AI", durationMs: 1000 },
  ],
  general: [
    { icon: "🎨", label: "Designing solution", labelAr: "تصميم الحل", agent: "Planner AI", durationMs: 1000 },
    { icon: "💻", label: "Building your project", labelAr: "بناء مشروعك", agent: "Code AI", durationMs: 1300 },
    { icon: "✍", label: "Polishing details", labelAr: "تحسين التفاصيل", agent: "Content AI", durationMs: 900 },
  ],
};

export function buildTimeline(kind: RequestKind): TimelineStep[] {
  return [...BASE_START, ...MIDDLE[kind], ...BASE_END];
}

export function agentsForKind(kind: RequestKind): string[] {
  const set = new Set<string>(["Planner AI", "QA AI", "Security AI", "Performance AI"]);
  for (const step of MIDDLE[kind]) set.add(step.agent);
  return Array.from(set);
}
