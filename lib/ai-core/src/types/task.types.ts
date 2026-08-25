/** Enum of all supported AI task types. Owner: types layer. */
export const TaskType = {
  TextChat: "text-chat",
  VoiceChat: "voice-chat",
  ImageGeneration: "image-generation",
  ImageAnalysis: "image-analysis",
  WebsiteGeneration: "website-generation",
  ApplicationGeneration: "application-generation",
  CodeReview: "code-review",
  BugFix: "bug-fix",
  DocumentAnalysis: "document-analysis",
  GeneralAI: "general-ai",
  Embedding: "embedding",
  // Phase 2 — Multi-AI Provider Architecture
  VideoGeneration: "video-generation",
  MusicGeneration: "music-generation",
  TextToSpeech: "text-to-speech",
  SpeechToText: "speech-to-text",
  InternetSearch: "internet-search",
  CodeExecution: "code-execution",
} as const;

export type TaskType = (typeof TaskType)[keyof typeof TaskType];
