import { randomUUID } from "node:crypto";
import { Router } from "express";
import { db, aiConversationsTable, aiConversationMessagesTable } from "@workspace/db";
import { and, desc, eq, asc } from "drizzle-orm";
import {
  AiChatBody, AiGenerateImageBody, AiEditImageBody, AiTranslateBody,
  AiSummarizeBody, AiCodeBody, AiDocumentBody, AiPresentationBody,
  AiContentBody, AiEmailBody, AiDataAnalysisBody, AiSearchBody,
  AiAnalyzeImageBody, AiOcrBody, AiWebsiteBody, AiAppBody,
  AiStudyBody, AiSecurityBody, AiVideoBody, AiAssistantBody,
} from "../lib/schemas/ai";
import {
  geminiChat, geminiGenerateImage, geminiAnalyzeMedia, codeChat, qwenImage, qwenImageEdit, qwenOmniChat, qwenSpeech, qwenVideoGenerate, groqCodeEdit,
  translateText, duckDuckGoSearch, runAssistant,
} from "../lib/providers";
import { deductCredits } from "../lib/credits";
import { checkVideoLimit } from "../lib/videoLimits";
import { optionalAuth, type AuthRequest } from "../middlewares/auth";


const router = Router();

type ConversationAttachment = { name: string; mimeType?: string; size?: number; url?: string };

async function saveAssistantConversation(
  userId: number | undefined,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  result: { provider: string; model: string; intent: string; preview?: unknown },
  attachments: ConversationAttachment[] = [],
  conversationId?: number,
) {
  if (!userId || messages.length === 0) return null;

  let conversation;
  if (conversationId) {
    [conversation] = await db.select().from(aiConversationsTable)
      .where(and(eq(aiConversationsTable.id, conversationId), eq(aiConversationsTable.userId, userId)))
      .limit(1);
  }
  if (!conversation) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const title = (lastUser?.content || "محادثة جديدة").replace(/\s+/g, " ").trim().slice(0, 80) || "محادثة جديدة";
    [conversation] = await db.insert(aiConversationsTable).values({ userId, title }).returning();
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const rows = [
    ...(lastUser ? [{
      conversationId: conversation.id,
      role: "user",
      content: lastUser.content,
      provider: null,
      model: null,
      intent: null,
      attachments,
      metadata: {},
    }] : []),
    {
      conversationId: conversation.id,
      role: "assistant",
      content: messages.at(-1)?.role === "assistant" && messages.at(-1)?.content ? messages.at(-1)!.content : (result as any).content,
      provider: result.provider,
      model: result.model,
      intent: result.intent,
      attachments: [],
      metadata: { preview: result.preview ?? null },
    },
  ];

  if (rows.length) await db.insert(aiConversationMessagesTable).values(rows as any);
  await db.update(aiConversationsTable).set({ updatedAt: new Date() }).where(eq(aiConversationsTable.id, conversation.id));
  return conversation.id;
}


// Real browser preview store. Generated code is never executed on the server; it is executed only inside the sandboxed browser iframe.
const previewStore = new Map<string, { files: Array<{ path: string; content: string }>; createdAt: number }>();

function createPreview(files: Array<{ path: string; content: string }>) {
  const id = randomUUID();
  previewStore.set(id, { files, createdAt: Date.now() });
  if (previewStore.size > 100) {
    const oldest = [...previewStore.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
    if (oldest) previewStore.delete(oldest[0]);
  }
  const base = process.env.PUBLIC_BASE_URL || "";
  return { id, url: `${base}/api/ai/preview/${id}` };
}

function sanitizeProjectFiles(input: unknown): Array<{ path: string; content: string }> {
  if (!Array.isArray(input)) return [];
  const out: Array<{ path: string; content: string }> = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const path = typeof (item as any).path === "string" ? (item as any).path : "";
    const content = typeof (item as any).content === "string" ? (item as any).content : "";
    const clean = path.replaceAll("\\", "/").replace(/^\/+/, "");
    if (!clean || clean.includes("../") || clean.startsWith("../") || clean.length > 180 || content.length > 220_000) continue;
    if (!/^[a-zA-Z0-9._\/-]+$/.test(clean)) continue;
    out.push({ path: clean, content });
  }
  return out.slice(0, 80);
}

// Extracts the first balanced top-level {...} block from arbitrary text, so a model
// that added a sentence before/after the JSON (despite being told not to) doesn't
// break parsing. Tracks string state so braces inside string values are ignored.
function extractJsonBlock(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === "\"") { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

// Coding models frequently paste multi-line HTML/CSS/JS straight into a JSON string
// value without escaping the line breaks (raw \n / \r / \t instead of "\\n"), which
// makes JSON.parse throw on otherwise well-formed output. This walks the text once,
// tracking whether we're inside a string, and escapes those raw control characters
// only when they appear inside a string value — never touching real JSON structure.
function repairJsonControlChars(text: string): string {
  let out = "";
  let inString = false;
  let escape = false;
  for (const ch of text) {
    if (escape) { out += ch; escape = false; continue; }
    if (ch === "\\") { out += ch; escape = true; continue; }
    if (ch === "\"") { inString = !inString; out += ch; continue; }
    if (inString && (ch === "\n" || ch === "\r" || ch === "\t")) {
      out += ch === "\n" ? "\\n" : ch === "\r" ? "\\r" : "\\t";
      continue;
    }
    out += ch;
  }
  return out;
}

function parseGeneratedProject(raw: string): Array<{ path: string; content: string }> {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  const tryParse = (text: string): Array<{ path: string; content: string }> | null => {
    try {
      const parsed = JSON.parse(text) as { files?: unknown };
      const files = sanitizeProjectFiles(parsed?.files);
      return files.some((f) => f.path.toLowerCase() === "index.html") ? files : null;
    } catch {
      return null;
    }
  };

  // 1) Direct parse. 2) Same text with control chars inside strings repaired.
  // 3) Extract the first balanced {...} block (strips any stray prose/fences the
  //    model added around it) and repeat 1–2 on just that block.
  const candidates: Array<() => string | null> = [
    () => cleaned,
    () => repairJsonControlChars(cleaned),
    () => extractJsonBlock(cleaned),
    () => { const b = extractJsonBlock(cleaned); return b ? repairJsonControlChars(b) : null; },
  ];
  for (const getCandidate of candidates) {
    const candidate = getCandidate();
    if (!candidate) continue;
    const result = tryParse(candidate);
    if (result) return result;
  }

  const html = cleaned.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return html ? [{ path: "index.html", content: html }] : [];
}

function renderPreview(files: Array<{ path: string; content: string }>): string {
  const index = files.find((f) => f.path.toLowerCase() === "index.html")?.content || files[0]?.content || "";
  let html = index;
  const inlineable = files.filter((f) => f.path !== "index.html");
  for (const file of inlineable) {
    const escaped = file.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (/\.css$/i.test(file.path)) {
      const re = new RegExp(`<link[^>]+href=[\"']${escaped}[\"'][^>]*>`, "i");
      html = html.replace(re, `<style data-runtime-file="${file.path}">${file.content}</style>`);
    }
    if (/\.m?js$/i.test(file.path)) {
      const re = new RegExp(`<script[^>]+src=[\"']${escaped}[\"'][^>]*>\s*</script>`, "i");
      html = html.replace(re, `<script data-runtime-file="${file.path}">${file.content}</script>`);
    }
  }
  if (!/<meta[^>]+charset=/i.test(html)) html = html.replace(/<head>/i, '<head><meta charset="utf-8">');
  if (!/<meta[^>]+name=[\"']viewport/i.test(html)) html = html.replace(/<head>/i, '<head><meta name="viewport" content="width=device-width, initial-scale=1">');
  return html;
}


// SECURITY/STABILITY FIX: every route below used to read `req.session.userId`,
// but express-session is never installed in this app (see lib/session.ts) —
// so `req.session` was `undefined` at runtime and EVERY /api/ai/* request
// threw a 500 before reaching its handler. `optionalAuth` populates
// `req.userId` from the real cookie/bearer session when present, and simply
// calls next() otherwise — preserving the original "credits are deducted
// when logged in, tools still work anonymously" behavior without crashing.
router.use(optionalAuth);

async function withCredits(
  req: AuthRequest, res: any,
  toolName: string, toolLabel: string, creditsUsed: number,
  handler: () => Promise<any>,
) {
  if (req.userId) {
    try {
      await deductCredits(req.userId, toolName, toolLabel, creditsUsed,
        typeof req.body?.prompt === "string" ? req.body.prompt :
        typeof req.body?.text === "string" ? req.body.text.slice(0, 200) :
        typeof req.body?.question === "string" ? req.body.question.slice(0, 200) :
        typeof req.body?.topic === "string" ? req.body.topic.slice(0, 200) :
        typeof req.body?.query === "string" ? req.body.query.slice(0, 200) :
        typeof req.body?.description === "string" ? req.body.description.slice(0, 200) : null,
      );
    } catch {
      return res.status(402).json({ error: "انتهى رصيدك اليومي. سيتجدد الرصيد خلال 24 ساعة." });
    }
  }
  return handler();
}

// POST /api/ai/chat
router.post("/ai/chat", async (req, res) => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { messages } = parsed.data;
  return withCredits(req, res, "chat", "محادثة كتابية", 5, async () => {
    const content = await geminiChat(messages as any, { thinking: true, temperature: 0.25 });
    return res.json({ content, model: process.env["GEMINI_MODEL"] || "gemini-2.5-pro", creditsUsed: 5 });
  });
});

// POST /api/ai/image
router.post("/ai/image", async (req, res) => {
  const parsed = AiGenerateImageBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { prompt, width = 1024, height = 1024 } = parsed.data;
  return withCredits(req, res, "image", "إنشاء الصور", 10, async () => {
    const imageUrl = await geminiGenerateImage(prompt);
    return res.json({ imageUrl, creditsUsed: 10 });
  });
});

// POST /api/ai/image/edit
router.post("/ai/image/edit", async (req, res) => {
  const parsed = AiEditImageBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { prompt, imageUrl } = parsed.data;
  return withCredits(req, res, "image-edit", "تعديل الصور", 10, async () => {
    const editedUrl = await geminiGenerateImage(prompt, imageUrl);
    return res.json({ imageUrl: editedUrl, creditsUsed: 10 });
  });
});

// POST /api/ai/translate
router.post("/ai/translate", async (req, res) => {
  const parsed = AiTranslateBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { text, targetLang, sourceLang } = parsed.data;
  return withCredits(req, res, "translate", "الترجمة", 2, async () => {
    const result = await translateText(text, targetLang, sourceLang ?? null);
    return res.json({ ...result, creditsUsed: 2 });
  });
});

// POST /api/ai/summarize
router.post("/ai/summarize", async (req, res) => {
  const parsed = AiSummarizeBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { text, style } = parsed.data;
  return withCredits(req, res, "summarize", "تلخيص الملفات", 4, async () => {
    const stylePrompt = style === "bullets" ? "كنقاط" : style === "detailed" ? "بشكل مفصل" : "بشكل موجز";
    const result = await geminiChat([
      { role: "system", content: "أنت مساعد ذكاء اصطناعي متخصص في التلخيص. لخص النص باللغة المناسبة." },
      { role: "user", content: `لخص النص التالي ${stylePrompt}:\n\n${text}` },
    ]);
    return res.json({ result, creditsUsed: 4 });
  });
});

// POST /api/ai/code
router.post("/ai/code", async (req, res) => {
  const parsed = AiCodeBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { prompt, language, mode } = parsed.data;
  return withCredits(req, res, "code", "إنشاء الأكواد", 7, async () => {
    const modeText = mode === "explain" ? "اشرح" : mode === "debug" ? "صحح أخطاء" : mode === "optimize" ? "حسّن" : "أنشئ";
    const langText = language ? `بلغة ${language}` : "";
    const draft = await codeChat([
      { role: "system", content: "أنت مبرمج خبير. أجب بالكود فقط مع شرح مختصر." },
      { role: "user", content: `${modeText} الكود التالي ${langText}:\n\n${prompt}` },
    ], { thinking: true, temperature: 0.1 });
    const result = await codeChat([
      { role: "system", content: "راجع الكود التالي مراجعة ثانية وأصلح أخطاء syntax والمنطق والأمان. أعد النسخة النهائية فقط." },
      { role: "user", content: draft },
    ], { thinking: true, temperature: 0.05 });
    return res.json({ result, creditsUsed: 7 });
  });
});

// POST /api/ai/document
router.post("/ai/document", async (req, res) => {
  const parsed = AiDocumentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { topic, docType, language } = parsed.data;
  return withCredits(req, res, "document", "إنشاء المستندات", 8, async () => {
    const lang = language ?? "ar";
    const type = docType ?? "report";
    const result = await geminiChat([
      { role: "system", content: `أنت كاتب محترف. اكتب المستند ${lang === "ar" ? "باللغة العربية" : "بالإنجليزية"}.` },
      { role: "user", content: `أنشئ ${type === "report" ? "تقريراً" : type === "proposal" ? "مقترحاً" : "رسالة"} احترافياً عن: ${topic}` },
    ]);
    return res.json({ result, creditsUsed: 8 });
  });
});

// POST /api/ai/presentation
router.post("/ai/presentation", async (req, res) => {
  const parsed = AiPresentationBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { topic, slides = 10, audience, language } = parsed.data;
  return withCredits(req, res, "presentation", "العروض التقديمية", 8, async () => {
    const result = await geminiChat([
      { role: "system", content: "أنت خبير في إنشاء العروض التقديمية. أنشئ مخططاً منظماً." },
      { role: "user", content: `أنشئ مخطط عرض تقديمي من ${slides} شرائح عن: ${topic}${audience ? `\nالجمهور المستهدف: ${audience}` : ""}. اجعل كل شريحة بعنوان ونقاط رئيسية.` },
    ]);
    return res.json({ result, creditsUsed: 8 });
  });
});

// POST /api/ai/content
router.post("/ai/content", async (req, res) => {
  const parsed = AiContentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { topic, contentType, tone, wordCount } = parsed.data;
  return withCredits(req, res, "content", "كتابة المحتوى", 7, async () => {
    const result = await geminiChat([
      { role: "system", content: "أنت كاتب محتوى احترافي متخصص في المحتوى الرقمي." },
      { role: "user", content: `اكتب ${contentType ?? "مقالاً"} ${tone ? `بأسلوب ${tone}` : ""} ${wordCount ? `من حوالي ${wordCount} كلمة` : ""} عن: ${topic}` },
    ]);
    return res.json({ result, creditsUsed: 7 });
  });
});

// POST /api/ai/email
router.post("/ai/email", async (req, res) => {
  const parsed = AiEmailBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { subject, context, tone, language } = parsed.data;
  return withCredits(req, res, "email", "كتابة الإيميلات", 5, async () => {
    const result = await geminiChat([
      { role: "system", content: `أنت خبير في كتابة الإيميلات الاحترافية. اكتب البريد ${language === "en" ? "بالإنجليزية" : "بالعربية"}.` },
      { role: "user", content: `اكتب بريداً إلكترونياً ${tone === "formal" ? "رسمياً" : tone === "urgent" ? "عاجلاً" : "ودياً"} بموضوع: "${subject}"\nالسياق: ${context}` },
    ]);
    return res.json({ result, creditsUsed: 5 });
  });
});

// POST /api/ai/data-analysis
router.post("/ai/data-analysis", async (req, res) => {
  const parsed = AiDataAnalysisBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { data, question, outputFormat } = parsed.data;
  return withCredits(req, res, "data", "تحليل البيانات", 8, async () => {
    const result = await geminiChat([
      { role: "system", content: "أنت محلل بيانات خبير. حلل البيانات وقدم رؤى واضحة ومنظمة." },
      { role: "user", content: `حلل البيانات التالية${question ? ` وأجب على: ${question}` : ""}${outputFormat ? `. قدم النتائج كـ${outputFormat}` : ""}:\n\n${data.slice(0, 3000)}` },
    ]);
    return res.json({ result, creditsUsed: 8 });
  });
});

// POST /api/ai/search
router.post("/ai/search", async (req, res) => {
  const parsed = AiSearchBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { query } = parsed.data;
  return withCredits(req, res, "search", "البحث الذكي", 3, async () => {
    const [results, summary] = await Promise.all([
      duckDuckGoSearch(query),
      geminiChat([
        { role: "system", content: "أنت مساعد بحث ذكي. قدم ملخصاً مفيداً ومختصراً." },
        { role: "user", content: `قدم ملخصاً مفيداً ومباشراً عن: "${query}" في 3-4 جمل.` },
      ]),
    ]);
    return res.json({ results, summary, creditsUsed: 3 });
  });
});

// POST /api/ai/analyze-image
router.post("/ai/analyze-image", async (req, res) => {
  const parsed = AiAnalyzeImageBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { imageUrl, question } = parsed.data;
  return withCredits(req, res, "analyze-image", "تحليل الصور", 8, async () => {
    const result = await geminiChat([
      { role: "system", content: "أنت نظام تحليل صور ذكي. صف وحلل الصورة بدقة." },
      { role: "user", content: `${question ? question : "صف وحلل هذه الصورة بالتفصيل"}: ${imageUrl}` },
    ]);
    return res.json({ result, creditsUsed: 8 });
  });
});

// POST /api/ai/ocr
router.post("/ai/ocr", async (req, res) => {
  const parsed = AiOcrBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { imageUrl, lang } = parsed.data;
  return withCredits(req, res, "ocr", "استخراج النصوص", 3, async () => {
    const result = await geminiChat([
      { role: "system", content: "أنت نظام OCR متخصص في استخراج النصوص من الصور. استخرج النص فقط بدون تفسير." },
      { role: "user", content: `استخرج كل النص الموجود في هذه الصورة${lang ? ` (اللغة: ${lang})` : ""}. أعد النص المستخرج فقط:\n${imageUrl}` },
    ]);
    return res.json({ result, creditsUsed: 3 });
  });
});

// POST /api/ai/website
router.post("/ai/website", async (req, res) => {
  const parsed = AiWebsiteBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { description, style, sections } = parsed.data;
  return withCredits(req, res, "website", "إنشاء المواقع", 15, async () => {
    const draft = await codeChat([
      { role: "system", content: "أنت مهندس مواقع خبير. أنشئ HTML/CSS/JS كاملًا في ملف واحد، متجاوبًا، وقابلًا للمعاينة مباشرة. أعد HTML فقط." },
      { role: "user", content: `أنشئ موقع ويب كامل عن: ${description}${style ? `\nالأسلوب: ${style}` : ""}${sections ? `\nالأقسام: ${sections}` : ""}` },
    ], { thinking: true, temperature: 0.12 });

    let result = await groqCodeEdit([
      { role: "system", content: "أنت مراجع كود Qwen متخصص في إصلاح HTML/CSS/JS. أصلح الأخطاء الواضحة وحافظ على المتطلبات. أعد HTML النهائي فقط، بلا Markdown." },
      { role: "user", content: draft },
    ], { temperature: 0.1 });

    result = result.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();
    if (!/^<!doctype html|^<html[\s>]/i.test(result)) result = draft.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();

    const preview = createPreview([{ path: "index.html", content: result }]);
    return res.json({
      result,
      previewUrl: preview.url,
      files: ["index.html"],
      model: process.env["OPENROUTER_CODE_MODEL"] || "qwen/qwen3-coder:free",
      reviewModel: process.env["GROQ_MODEL"] || "qwen/qwen3.6-27b",
      creditsUsed: 15,
    });
  });
});

// POST /api/ai/app
router.post("/ai/app", async (req, res) => {
  const parsed = AiAppBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { description, framework, features } = parsed.data;
  return withCredits(req, res, "app", "إنشاء التطبيقات", 15, async () => {
    const draft = await codeChat([
      { role: "system", content: "أنت مهندس تطبيقات خبير. أنشئ Prototype كاملًا وقابلًا للمعاينة داخل المتصفح كملف HTML واحد. أعد HTML فقط." },
      { role: "user", content: `أنشئ تطبيقًا تفاعليًا ${framework ? `باستخدام مفهوم ${framework}` : ""} بالمواصفات التالية:\n${description}${features ? `\nالميزات: ${features}` : ""}` },
    ], { thinking: true, temperature: 0.12 });

    let result = await groqCodeEdit([
      { role: "system", content: "أنت Qwen متخصص في تعديل كود التطبيقات. أصلح أخطاء HTML/CSS/JS، حسّن التفاعل، ولا تغيّر المتطلبات. أعد HTML النهائي فقط، بلا Markdown." },
      { role: "user", content: draft },
    ], { temperature: 0.1 });

    result = result.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();
    if (!/^<!doctype html|^<html[\s>]/i.test(result)) result = draft.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();

    const preview = createPreview([{ path: "index.html", content: result }]);
    return res.json({
      result,
      previewUrl: preview.url,
      files: ["index.html"],
      model: process.env["OPENROUTER_CODE_MODEL"] || "qwen/qwen3-coder:free",
      reviewModel: process.env["GROQ_MODEL"] || "qwen/qwen3.6-27b",
      creditsUsed: 15,
    });
  });
});

// POST /api/ai/study
router.post("/ai/study", async (req, res) => {
  const parsed = AiStudyBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { topic, mode, level } = parsed.data;
  return withCredits(req, res, "study", "مساعد الدراسة", 5, async () => {
    const modePrompts: Record<string, string> = {
      explain: `اشرح الموضوع التالي ${level === "beginner" ? "للمبتدئين" : level === "advanced" ? "للمستوى المتقدم" : "بشكل واضح"}`,
      quiz: `أنشئ 5 أسئلة اختيار من متعدد مع الإجابات عن`,
      summarize: `لخص الموضوع التالي بنقاط رئيسية`,
      flashcards: `أنشئ 10 بطاقات تعليمية (سؤال وجواب) عن`,
    };
    const prompt = `${modePrompts[mode] ?? "اشرح"}: ${topic}`;
    const result = await geminiChat([
      { role: "system", content: "أنت مدرس ذكي ومتخصص. قدم محتوى تعليمياً واضحاً ومنظماً." },
      { role: "user", content: prompt },
    ]);
    return res.json({ result, creditsUsed: 5 });
  });
});

// POST /api/ai/security
router.post("/ai/security", async (req, res) => {
  const parsed = AiSecurityBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { question, context } = parsed.data;
  return withCredits(req, res, "security", "مساعد الأمن السيبراني", 6, async () => {
    const result = await geminiChat([
      { role: "system", content: "أنت خبير أمن سيبراني متخصص. تساعد في الأمن للاستخدامات القانونية والتعليمية فقط. لا تساعد في أي نشاط غير قانوني أو ضار." },
      { role: "user", content: `${context ? `السياق: ${context}\n` : ""}السؤال: ${question}` },
    ]);
    return res.json({ result, creditsUsed: 6 });
  });
});

// POST /api/ai/video
// Phase 2 — Multi-AI Provider Architecture: Veo (primary) -> Runway
// (secondary) -> Kling AI (fallback), routed through the shared
// Provider Manager (@workspace/ai-core) with automatic retry-then-failover
// instead of a single hardcoded provider. Daily generation count is capped
// by plan (Free: 1/24h, Premium: 2/24h, Pro: 5/24h) — checked before any
// provider is called and before credits are charged, so a request over the
// day's limit never costs credits or hits a paid API.
router.post("/ai/video", async (req: AuthRequest, res) => {
  const parsed = AiVideoBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { prompt, durationSeconds } = parsed.data;

  if (req.userId) {
    const limit = await checkVideoLimit(req.userId);
    if (!limit.allowed) {
      return res.status(429).json({
        error: `وصلت للحد الأقصى لتوليد الفيديو اليومي لخطتك (${limit.limit} فى كل 24 ساعة). يتجدد الحد الساعة ${limit.resetsAt.toISOString()}.`,
        plan: limit.plan,
        limit: limit.limit,
        used: limit.used,
      });
    }
  }

  return withCredits(req, res, "video", "إنشاء الفيديو", 20, async () => {
    try {
      const videoUrl = await qwenVideoGenerate(prompt, durationSeconds);
      return res.json({ videoUrl, providerId: "qwen-wan2.7", creditsUsed: 20 });
    } catch (error) {
      return res.status(502).json({ error: error instanceof Error ? error.message : "تعذر إنشاء الفيديو حالياً." });
    }
  });
});

// POST /api/ai/builder — real browser project runtime.
// Qwen returns a small multi-file web project manifest. The server never executes
// generated code; it only stores the files and assembles browser assets for the
// isolated iframe preview. This gives us real HTML/CSS/JS execution without
// turning the API server into an arbitrary-code execution host.
router.post("/ai/builder", async (req: AuthRequest, res) => {
  const { prompt, previousFiles = [], previousCode = "", kind = "website" } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 12000) {
    return res.status(400).json({ error: "الطلب غير صالح" });
  }
  if (!Array.isArray(previousFiles) || previousFiles.length > 80) {
    return res.status(400).json({ error: "ملفات المشروع السابقة غير صالحة" });
  }
  if (typeof previousCode !== "string" || previousCode.length > 220000) {
    return res.status(400).json({ error: "حجم المشروع السابق كبير جدًا" });
  }

  return withCredits(req, res, "builder", "إنشاء وتعديل المواقع والتطبيقات", 15, async () => {
    const oldFiles = sanitizeProjectFiles(previousFiles);
    const fallbackOld = oldFiles.length ? oldFiles : (previousCode.trim() ? [{ path: "index.html", content: previousCode }] : []);
    const isEdit = fallbackOld.length > 0;

    const system = `أنت محرك بناء مواقع وتطبيقات داخل منصة NEXORA.
أنتج مشروع ويب حقيقيًا متعدد الملفات وقابلًا للتشغيل داخل المتصفح.
أعد JSON فقط بالشكل: {"files":[{"path":"index.html","content":"..."},{"path":"styles.css","content":"..."},{"path":"app.js","content":"..."}]}
قواعد صارمة:
- يجب أن يوجد index.html.
- هذا المشروع مخصص لمعاينة حقيقية داخل المتصفح؛ لذلك يجب أن يكون الكود متوافقًا مع Browser Runtime.
- استخدم HTML5 + CSS3 + JavaScript (ES2020+) فقط ككود تنفيذي أساسي.
- لا تستخدم TypeScript أو JSX/TSX أو Python أو PHP أو Node.js أو Next.js أو أي Backend/Build step؛ لن يتم تشغيلها في المعاينة الحالية.
- يمكن استخدام React أو مكتبات Frontend أخرى فقط عبر CDN داخل index.html، وبدون JSX أو خطوة bundling/build.
- اجعل الموقع متجاوبًا واحترافيًا ويعمل مباشرة في المتصفح.
- يمكن تقسيم CSS وJavaScript إلى ملفات .css و.js منفصلة وربطها من index.html؛ سيقوم Runtime بدمجها وتشغيلها.
- لا تستخدم backend أو أوامر نظام أو eval أو Function أو تحميل سكربتات مجهولة.
- لا تضع مفاتيح API أو أسرارًا في المشروع.
- لا تعتمد على node_modules أو npm install أو أي خطوة build.
- إذا احتجت مكتبة، استخدم CDN موثوقًا ومباشرًا داخل HTML فقط.
- إذا كان طلب المستخدم يتطلب Backend أو قاعدة بيانات حقيقية، لا تتظاهر بأنها تعمل؛ أنشئ أفضل تجربة Frontend قابلة للمعاينة واذكر أن Backend الحقيقي يحتاج Runtime Server.
- عند طلب تطبيق، أنشئ تجربة تفاعلية فعلية: تنقل، أزرار، نماذج، حالات وبيانات محلية.
- عند التعديل، حافظ على الملفات والوظائف الحالية وعدّل المطلوب فقط.
- لا تغيّر المسارات بلا سبب.
- حد أقصى 60 ملفًا، و220000 حرف لكل ملف إجمالًا للمشروع.
`;

    const previousContext = isEdit
      ? `\nالمشروع الحالي (JSON):\n${JSON.stringify({ files: fallbackOld }).slice(0, 420000)}\n`
      : "";
    const user = `${isEdit ? "عدّل المشروع الحالي" : `ابنِ ${kind === "app" ? "تطبيق ويب تفاعلي" : "موقع ويب"}`} حسب طلب المستخدم:\n${prompt}${previousContext}`;

    const raw = isEdit
      ? await groqCodeEdit([
          { role: "system", content: system + "\nأنت مراجع ومصلح كود. أعد المشروع المعدل كاملًا في JSON." },
          { role: "user", content: user },
        ], { temperature: 0.08 })
      : await codeChat([
          { role: "system", content: system },
          { role: "user", content: user },
        ], { temperature: 0.1 });

    let files = parseGeneratedProject(raw);
    if (!files.length) throw new Error("نموذج البرمجة أعاد مشروعًا غير صالح.");
    files = sanitizeProjectFiles(files);
    if (!files.some((f) => f.path.toLowerCase() === "index.html")) {
      throw new Error("المشروع الناتج لا يحتوي على index.html.");
    }

    const preview = createPreview(files);
    const html = files.find((f) => f.path.toLowerCase() === "index.html")?.content || "";
    return res.json({
      code: html,
      files,
      previewUrl: preview.url,
      previewId: preview.id,
      name: prompt.length > 60 ? `${prompt.slice(0, 57)}...` : prompt,
      tasksCompleted: isEdit ? 2 : 3,
      runtime: "browser-static-runtime",
      execution: "real-browser",
      model: isEdit ? (process.env["GROQ_MODEL"] || "qwen/qwen3.6-27b") : (process.env["OPENROUTER_CODE_MODEL"] || "qwen/qwen3-coder:free"),
      reviewModel: isEdit ? (process.env["GROQ_MODEL"] || "qwen/qwen3.6-27b") : undefined,
      creditsUsed: 15,
    });
  });
});

// GET /api/ai/preview/:id — project preview only; normal chat never creates a preview.
router.get("/ai/preview/:id", async (req, res) => {
  const item = previewStore.get(req.params.id);
  if (!item) return res.status(404).send("Preview غير متاح أو انتهت صلاحيته.");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Security-Policy", "default-src 'self' https: data: blob:; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' https:; connect-src 'none'; frame-ancestors *;");
  return res.send(renderPreview(item.files));
});

// POST /api/ai/omni — Qwen multimodal voice/video/image conversation.
router.post("/ai/omni", async (req: AuthRequest, res) => {
  const { text = "حلل الوسائط المرفقة واذكر أهم ما فيها.", mediaBase64, mimeType, kind = "audio", voice, conversationId, attachment } = req.body || {};
  if (typeof text !== "string" || text.length > 6000) return res.status(400).json({ error: "النص غير صالح" });
  if (mediaBase64 && typeof mediaBase64 !== "string") return res.status(400).json({ error: "الوسائط غير صالحة" });
  try {
    if (!mediaBase64 || !mimeType) return res.status(400).json({ error: "الوسائط مطلوبة" });
    const useGemini = kind === "image" || kind === "video";
    const textResult = useGemini
      ? await geminiAnalyzeMedia({ text, mediaBase64, mimeType })
      : (await qwenOmniChat({ text, mediaBase64, mimeType, kind, voice })).text;
    const provider = useGemini ? "gemini" : "openrouter";
    const model = useGemini ? (process.env["GEMINI_MODEL"] || "gemini-2.5-pro") : (process.env["OPENROUTER_QWEN_OMNI_MODEL"] || "qwen/qwen3.5-122b-a10b");
    const savedConversationId = await saveAssistantConversation(
      (req as AuthRequest).userId,
      [{ role: "user", content: text }, { role: "assistant", content: textResult }],
      { provider, model, intent: "chat" },
      attachment ? [attachment] : [],
      typeof conversationId === "number" ? conversationId : undefined,
    );
    return res.json({ result: textResult, audioBase64: "", model, provider, conversationId: savedConversationId });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : "تعذر تشغيل Qwen Omni" });
  }
});

// POST /api/ai/speech — text to speech using Qwen Omni.
router.post("/ai/speech", async (req, res) => {
  const { text, voice } = req.body || {};
  if (typeof text !== "string" || !text.trim() || text.length > 6000) return res.status(400).json({ error: "النص غير صالح" });
  try {
    const result = await qwenSpeech(text, voice);
    return res.json({ audioBase64: result.audioBase64, model: process.env["OPENROUTER_QWEN_OMNI_MODEL"] || "qwen/qwen3.5-122b-a10b" });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : "تعذر تحويل النص إلى صوت" });
  }
});

// POST /api/ai/assistant — one visible Cyber AI agent.
router.post("/ai/assistant", async (req, res) => {
  const parsed = AiAssistantBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { messages, attachments = [], conversationId } = parsed.data;
  return withCredits(req, res, "assistant", "المساعد الرئيسي", 8, async () => {
    try {
      const result = await runAssistant(messages as any, createPreview, attachments as any);
      const savedConversationId = await saveAssistantConversation((req as AuthRequest).userId, messages as any, result, attachments as any, conversationId);
      return res.json({ ...result, conversationId: savedConversationId, creditsUsed: 8 });
    } catch (error) {
      console.error("Cyber AI error", error);
      return res.status(502).json({ error: "تعذر تنفيذ الطلب الآن. إذا كنت في Demo Mode فتأكد من DEMO_INFERENCE_URL، وإلا فتأكد من إعداد مزود الذكاء الاصطناعي." });
    }
  });
});

// POST /api/ai/assistant/stream — same agent, but the final answer is emitted gradually.
router.post("/ai/assistant/stream", async (req, res) => {
  const parsed = AiAssistantBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const { messages, attachments = [], conversationId } = parsed.data;
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  try {
    send("status", { text: "جاري فهم طلبك واختيار المسار المناسب..." });
    const result = await runAssistant(messages as any, createPreview, attachments as any, (text) => send("status", { text }));
    for (const step of result.steps) send("status", { text: step });
    const chunks = result.content.match(/\S+\s*/g) || [result.content];
    let partial = "";
    for (const chunk of chunks) {
      partial += chunk;
      send("delta", { text: chunk });
      await new Promise((r) => setTimeout(r, 8));
    }
    const savedConversationId = await saveAssistantConversation((req as AuthRequest).userId, messages as any, result, attachments as any, conversationId);
    send("done", { intent: result.intent, provider: result.provider, model: result.model, conversationId: savedConversationId, content: partial, preview: result.preview, creditsUsed: 8 });
    res.end();
  } catch (error) {
    console.error("Cyber AI stream error", error);
    send("error", { message: "تعذر تنفيذ الطلب الآن. إذا كنت في Demo Mode فتأكد من DEMO_INFERENCE_URL، وإلا فتأكد من إعداد مزود الذكاء الاصطناعي." });
    res.end();
  }
});



// Persistent Cyber AI history. Only the authenticated user's records are returned.
router.get("/ai/conversations", optionalAuth, async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  const conversations = await db.select().from(aiConversationsTable)
    .where(eq(aiConversationsTable.userId, req.userId))
    .orderBy(desc(aiConversationsTable.updatedAt), desc(aiConversationsTable.id));
  return res.json({ conversations });
});

router.get("/ai/conversations/:id", optionalAuth, async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  const id = Number(req.params.id);
  const [conversation] = await db.select().from(aiConversationsTable)
    .where(and(eq(aiConversationsTable.id, id), eq(aiConversationsTable.userId, req.userId)))
    .limit(1);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });
  const messages = await db.select().from(aiConversationMessagesTable)
    .where(eq(aiConversationMessagesTable.conversationId, id))
    .orderBy(asc(aiConversationMessagesTable.createdAt), asc(aiConversationMessagesTable.id));
  return res.json({ conversation, messages });
});

router.delete("/ai/conversations/:id", optionalAuth, async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  const id = Number(req.params.id);
  const deleted = await db.delete(aiConversationsTable)
    .where(and(eq(aiConversationsTable.id, id), eq(aiConversationsTable.userId, req.userId)))
    .returning({ id: aiConversationsTable.id });
  if (!deleted.length) return res.status(404).json({ error: "Conversation not found" });
  return res.json({ ok: true });
});

export default router;
