# ملاحظات الدمج — Merge Notes

تاريخ الدمج: 2026-07-12

## مصادر الدمج / Merge Sources

| المصدر | الوصف |
|--------|-------|
| `ai-cyberai-source` (zip1) | الإصدار الأساسي: frontend (AI Tools: Chat, Code, Content, Data, Document, Image, Translate, Voice, Website) + backend أساسي + نظام Credits |
| `ai-platform-phase1` (zip2) | الإصدار المتقدم: منصة Cyber AI الكاملة مع وكلاء AI، وسائط، أمان، تحليلات، مجتمع |
| `ai-platform-phase3` (zip2 root) | تطبيق Workspace Builder مستقل (TanStack Router + Vite + Bun) |

## هيكل المشروع المدمج / Final Structure

```
merged-project/
├── artifacts/
│   ├── ai-cyberai/              ← Frontend React+Vite (Phase1 + AI Tools من Phase0)
│   │   └── src/pages/tools/ ← صفحات أدوات AI: Chat, Code, Content, Data, Document,
│   │                           Image, Translate, Voice, Website
│   ├── api-server/          ← Express 5 API (Phase1 + مسارات: ai, credits, providers)
│   └── workspace-builder/   ← Phase3: Workspace Builder (TanStack Router + Bun)
│
├── lib/
│   ├── agents/              ← نظام الوكلاء المتعدد (15+ وكيل: coding, debug, deployment, ...)
│   ├── agents-ui/           ← مكونات واجهة الوكلاء
│   ├── ai-core/             ← نواة AI (providers, memory, prompts)
│   ├── api-client-react/    ← Orval-generated React Query hooks
│   ├── api-spec/            ← OpenAPI spec (مصدر الحقيقة)
│   ├── api-zod/             ← Zod schemas مولّدة
│   ├── app-builder/         ← منشئ التطبيقات
│   ├── core/                ← المكتبة الأساسية المشتركة
│   ├── db/                  ← Drizzle ORM (schemas: users, portfolio, chat,
│   │                           follows, stories, notifications, reputation,
│   │                           privacy, analytics, ai-governance, credits, creditsHistory)
│   ├── deploy-platform/     ← منصة النشر (server-manager, workers, queue)
│   ├── media-adapters/      ← محوّلات الوسائط
│   ├── media-ai/            ← AI للوسائط
│   ├── media-core/          ← نواة معالجة الوسائط
│   ├── media-db/            ← قاعدة بيانات الوسائط
│   ├── media-workers/       ← عمّال معالجة الوسائط
│   ├── observability/       ← المراقبة والتحليلات
│   ├── phase8/              ← ميزات المرحلة 8
│   └── platform-core/       ← النواة الأساسية للمنصة
│
├── docs/                    ← التوثيق (ADRs, media pipeline, observability)
├── tests/                   ← الاختبارات (e2e, integration, contract)
├── scripts/                 ← سكريبتات التشغيل
└── ...                      ← ملفات الإعداد (docker-compose, Dockerfile, etc.)
```

## ما تمّ دمجه / What Was Merged

### من ai-cyberai-source (zip1) → phase1 يكون الأساس:
- ✅ `artifacts/cyber-ai/src/pages/tools/` — 9 صفحات أدوات AI (غير موجودة في phase1)
- ✅ `artifacts/cyber-ai/src/components/CreditsWidget.tsx`
- ✅ `artifacts/cyber-ai/src/components/ProtectedRoute.tsx`
- ✅ `artifacts/cyber-ai/src/components/ToolPageWrapper.tsx`
- ✅ `artifacts/cyber-ai/src/components/theme-provider.tsx`
- ✅ `artifacts/cyber-ai/src/hooks/use-auth.tsx`
- ✅ `artifacts/cyber-ai/src/hooks/use-credits-manager.tsx`
- ✅ `artifacts/cyber-ai/src/lib/tools.ts`
- ✅ `artifacts/api-server/src/routes/ai.ts` — مسار AI
- ✅ `artifacts/api-server/src/routes/credits.ts` — مسار Credits
- ✅ `artifacts/api-server/src/routes/providers.ts` — مسار Providers
- ✅ `artifacts/api-server/src/lib/credits.ts`
- ✅ `artifacts/api-server/src/lib/providers.ts`
- ✅ `artifacts/api-server/src/lib/session.ts`
- ✅ `lib/db/src/schema/credits.ts` — جدول Credits
- ✅ `lib/db/src/schema/creditsHistory.ts` — جدول تاريخ Credits
- ✅ تحديث `lib/db/src/schema/index.ts` لتصدير الجداول الجديدة

### من ai-platform-phase3 (zip2 root) → workspace-builder جديد:
- ✅ `artifacts/workspace-builder/` — تطبيق Workspace Builder كامل

## الوكلاء المتوفرة / Available Agents (lib/agents)

1. ApplicationAgent — تنفيذ التطبيقات
2. ArchitectureAgent — تصميم البنية
3. CodingAgent — كتابة الكود
4. DebugAgent — تصحيح الأخطاء
5. DeploymentAgent — النشر
6. DocumentationAgent — التوثيق
7. FileAgent — إدارة الملفات
8. + المزيد + MasterOrchestrator + TaskScheduler

## للبدء / Getting Started

```bash
# 1. تثبيت المتطلبات
pnpm install

# 2. إعداد قاعدة البيانات
cp .env.example .env
docker compose up -d postgres redis

# 3. تطبيق migrations
pnpm --filter @workspace/db run migrate

# 4. تشغيل الخادم
pnpm --filter @workspace/api-server dev

# 5. تشغيل الواجهة
pnpm --filter @workspace/cyber-ai dev

# 6. تشغيل workspace-builder (Phase3)
cd artifacts/workspace-builder && bun dev
```
