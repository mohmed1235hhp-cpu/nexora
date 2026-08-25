import { z } from "zod";

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
});

export const AiChatBody = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(50),
});

export const AiGenerateImageBody = z.object({
  prompt: z.string().min(1).max(2000),
  width: z.number().int().min(256).max(1792).optional(),
  height: z.number().int().min(256).max(1792).optional(),
});

export const AiEditImageBody = z.object({
  prompt: z.string().min(1).max(2000),
  imageUrl: z.string().url(),
});

export const AiTranslateBody = z.object({
  text: z.string().min(1).max(5000),
  targetLang: z.string().min(2).max(10),
  sourceLang: z.string().min(2).max(10).optional(),
});

export const AiSummarizeBody = z.object({
  text: z.string().min(1).max(20000),
  style: z.enum(["bullets", "detailed", "brief"]).optional(),
});

export const AiCodeBody = z.object({
  prompt: z.string().min(1).max(4000),
  language: z.string().max(40).optional(),
  mode: z.enum(["generate", "explain", "debug", "optimize"]).optional(),
});

export const AiDocumentBody = z.object({
  topic: z.string().min(1).max(500),
  docType: z.enum(["report", "proposal", "letter"]).optional(),
  language: z.enum(["ar", "en"]).optional(),
});

export const AiPresentationBody = z.object({
  topic: z.string().min(1).max(500),
  slides: z.number().int().min(1).max(30).optional(),
  audience: z.string().max(200).optional(),
  language: z.enum(["ar", "en"]).optional(),
});

export const AiContentBody = z.object({
  topic: z.string().min(1).max(500),
  contentType: z.string().max(60).optional(),
  tone: z.string().max(60).optional(),
  wordCount: z.number().int().min(20).max(5000).optional(),
});

export const AiEmailBody = z.object({
  subject: z.string().min(1).max(300),
  context: z.string().min(1).max(3000),
  tone: z.enum(["formal", "urgent", "friendly"]).optional(),
  language: z.enum(["ar", "en"]).optional(),
});

export const AiDataAnalysisBody = z.object({
  data: z.string().min(1).max(20000),
  question: z.string().max(1000).optional(),
  outputFormat: z.string().max(60).optional(),
});

export const AiSearchBody = z.object({
  query: z.string().min(1).max(300),
});

export const AiAnalyzeImageBody = z.object({
  imageUrl: z.string().url(),
  question: z.string().max(1000).optional(),
});

export const AiOcrBody = z.object({
  imageUrl: z.string().url(),
  lang: z.string().max(10).optional(),
});

export const AiWebsiteBody = z.object({
  description: z.string().min(1).max(3000),
  style: z.string().max(200).optional(),
  sections: z.string().max(500).optional(),
});

export const AiAppBody = z.object({
  description: z.string().min(1).max(3000),
  framework: z.string().max(60).optional(),
  features: z.string().max(1000).optional(),
});

export const AiStudyBody = z.object({
  topic: z.string().min(1).max(500),
  mode: z.enum(["explain", "quiz", "summarize", "flashcards"]),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

export const AiSecurityBody = z.object({
  question: z.string().min(1).max(2000),
  context: z.string().max(2000).optional(),
});

export const AiVideoBody = z.object({
  prompt: z.string().min(1).max(2000),
  durationSeconds: z.number().int().min(1).max(30).optional(),
});

export const AiAssistantBody = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(50),
  conversationId: z.number().int().positive().optional(),
  attachments: z.array(z.object({
    name: z.string().min(1).max(300),
    mimeType: z.string().max(200).optional(),
    size: z.number().int().nonnegative().max(50_000_000).optional(),
    url: z.string().max(2000).optional(),
  })).max(10).optional().default([]),
});

// ── Phase 2 — Multi-AI Provider Architecture: new capabilities ──────────────

export const AiMusicBody = z.object({
  prompt: z.string().min(1).max(1000),
  durationSeconds: z.number().int().min(5).max(240).optional(),
});

export const AiTextToSpeechBody = z.object({
  text: z.string().min(1).max(5000),
  voice: z.string().max(100).optional(),
});

export const AiSpeechToTextBody = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().max(100).optional(),
});

export const AiWebSearchBody = z.object({
  query: z.string().min(1).max(500),
});

export const AiCodeExecuteBody = z.object({
  code: z.string().min(1).max(20000),
  language: z.string().max(50).optional(),
});


export const AiOmniBody = z.object({
  text: z.string().max(6000).optional(),
  mediaBase64: z.string().optional(),
  mimeType: z.string().max(100).optional(),
  kind: z.enum(["audio", "video", "image"]).optional(),
  voice: z.string().max(40).optional(),
});
