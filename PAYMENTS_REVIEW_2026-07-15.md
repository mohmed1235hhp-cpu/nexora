# مراجعة هندسية شاملة — نظام المدفوعات (Cyber AI)

تاريخ: 2026-07-15
نطاق المراجعة: نظام المدفوعات فقط. لم تُضف مميزات جديدة، ولم تُحذف
ملفات، ولم يُغيَّر تصميم الواجهات، ولم تُعَد كتابة النظام.

## 1. الملفات المشمولة

- `artifacts/api-server/src/app.ts`
- `artifacts/api-server/src/routes/webhooks.ts`
- `artifacts/api-server/src/routes/payments.ts`
- `artifacts/api-server/src/routes/admin-payments.ts`
- `artifacts/api-server/src/lib/payments/service.ts`
- `artifacts/api-server/src/lib/payments/registry.ts`
- `artifacts/api-server/src/lib/payments/plans.ts`
- `artifacts/api-server/src/lib/payments/types.ts`
- `artifacts/api-server/src/lib/payments/invoice-pdf.ts`
- `artifacts/api-server/src/lib/payments/providers/{stripe,paypal,paymob,fawry}.ts`
- `artifacts/cyber-ai/src/pages/billing.tsx`
- `lib/db/src/schema/billing.ts`

## 2. الأخطاء الحرجة التي جرى إصلاحها

### 2.1 كسر تحقق توقيع الـ webhooks (Stripe/Paymob/Fawry) — Critical
- **السبب**: راوتر `/api/webhooks` كان يُركَّب عبر `import().then()`
  غير متزامن بعد `express.json()` و CSRF و rate-limit، فيستهلك
  JSON parser جسم الطلب قبل أن يصل للـ handler، فيفشل التحقق من
  توقيع HMAC دائمًا.
- **الإصلاح** (`app.ts`): استيراد ثابت لراوتر الـ webhooks، وتركيبه
  **قبل** أي middleware يستهلك الجسم، مع `express.raw({ type: "*/*" })`
  لضمان وصول الـ buffer الخام إلى المزوّد.

### 2.2 حفظ payloads غير مُتحقَّق من توقيعها + كسر الـ idempotency
- **السبب**: `webhooks.ts` كان يحفظ الحدث في `webhook_events` قبل
  التحقق من التوقيع، ويولّد `evt_${Date.now()}` عند غياب `eventId`
  ممّا يفقد قدرة الـ dedupe.
- **الإصلاح**: التحقق من التوقيع أولًا؛ رفض 400 عند غياب معرِّف
  الحدث؛ الحفظ فقط بعد نجاح التحقق.

### 2.3 `recordWebhookIfNew` كان يبتلع كل أخطاء قاعدة البيانات
- **السبب**: `try/catch` عام يُرجع `{ isNew: false }` لأي خطأ، ممّا
  يجعل انقطاع الاتصال أو خرق سياسة يبدو تسليمًا مكررًا ناجحًا —
  فيُسقط أحداث دفع حقيقية.
- **الإصلاح** (`service.ts`): التقاط `SQLSTATE 23505` فقط
  (UNIQUE violation) كتكرار، وإعادة رفع أي خطأ آخر ليعيد المزوّد
  المحاولة.

### 2.4 `upsertSubscriptionOnCheckout` لم يكن upsert فعليًا
- **السبب**: كان `INSERT` مباشر، فكل ضغطة/إعادة تحميل تنتج صف
  اشتراك `incomplete` جديد، والـ webhook لا يفعّل سوى الأحدث،
  فيتبقى صفوف يتيمة.
- **الإصلاح**: البحث عن صف `incomplete` قائم لنفس
  (userId, provider, plan) وتحديثه بدل الإدراج.

### 2.5 تصادم أرقام الفواتير عند التزامن
- **السبب**: `INV-YYYY-<Date.now().slice(-8)>` يتصادم بين
  فواتير متزامنة، فيُرفض بواسطة UNIQUE index ويظهر 500 للمستخدم.
- **الإصلاح**: إضافة عشوائية `randomBytes(3).toString("hex")`
  إلى رقم الفاتورة، مع إبقاء الشكل المألوف للمستخدم.

### 2.6 تحديث حالة الاسترداد بدون قيد المستخدم
- **السبب**: عند حدث refund كان `UPDATE payments SET status='refunded'
  WHERE providerPaymentId = ?` بدون قيد على `userId` أو `provider`.
- **الإصلاح** (`webhooks.ts`): إضافة `AND provider = ? AND userId = ?`
  لضمان عدم تعديل مدفوعات مستخدم آخر عند أي تصادم نظري.

## 3. الملفات المعدَّلة

- `artifacts/api-server/src/app.ts`
- `artifacts/api-server/src/routes/webhooks.ts`
- `artifacts/api-server/src/lib/payments/service.ts`

لم تُحذف أي ملفات. لم تُغيَّر أي واجهة (UI). لم تُضف مميزات جديدة.

## 4. توصيات لم تُنفَّذ (خارج نطاق «أصلح فقط»)

هذه ملاحظات تركتها بدون تعديل احترامًا للقيود:
- `paymentsTable` يستفيد من فهرس مركّب `(provider, providerPaymentId)`
  للتسوية السريعة.
- `webhook_events(provider, event_id)` يجب التأكد من وجود UNIQUE
  index (الإصلاح الحالي يعتمد على رمز الخطأ 23505).
- توليد PDF الحالي بسيط ولا يدعم العربية بشكل صحيح — يحتاج خطًا
  مضمَّنًا لاحقًا إن أُريد فواتير بالعربية.
- واجهة `billing.tsx`: تحسين معالجة أخطاء الشبكة (toast + retry)
  دون تغيير التصميم.

## 5. التحقق

- تم تشغيل `tsc` على الملفات المعدَّلة؛ لا أخطاء أنواع ناتجة عن
  التعديلات (الأخطاء المتبقية كلها بسبب عدم تثبيت الحزم في بيئة
  المراجعة، لا علاقة لها بالتغييرات).
