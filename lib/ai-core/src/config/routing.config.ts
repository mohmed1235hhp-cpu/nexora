import { TaskType } from "../types/task.types";
import type { Capability } from "../types/capability.types";

/**
 * ROUTING_CONFIG — the single source of truth for provider failover order.
 *
 * For every capability the array is ordered [primary, secondary, fallback, ...].
 * ProviderRegistry.findByCapability() reads this table first; a provider id
 * with no explicit chain still resolves via its own `descriptor.priority`
 * (see ProviderRegistry), so adding a new provider without updating this
 * file degrades gracefully instead of breaking anything.
 *
 * This is the ONLY file that needs to change to re-order or replace a
 * provider for a given feature — no application code depends on provider
 * identity, only on capability (see docs/ARCHITECTURE.md).
 */
export const ROUTING_CONFIG: Partial<Record<Capability, string[]>> = {
  // Chat: Gemini first for the main conversational experience, then fast fallbacks.
  [TaskType.TextChat]: ["gemini", "groq", "openai"],

  // App Generation: Claude → Replit Agent → Gemini
  [TaskType.ApplicationGeneration]: ["claude", "replit-agent", "gemini"],

  // Website Generation: Replit Agent → Claude → Bolt.new
  [TaskType.WebsiteGeneration]: ["replit-agent", "claude", "bolt-new"],

  // Image Generation: OpenAI Images → Flux → Stable Diffusion
  [TaskType.ImageGeneration]: ["openai-images", "flux", "stable-diffusion"],
  // Image analysis reuses the general vision-capable chat models.
  [TaskType.ImageAnalysis]: ["claude", "openai", "groq"],

  // Video Generation: Veo → Runway → Kling AI
  [TaskType.VideoGeneration]: ["veo", "runway", "kling-ai"],

  // Music: Suno → Udio → Stable Audio
  [TaskType.MusicGeneration]: ["suno", "udio", "stable-audio"],

  // Voice — Text To Speech: ElevenLabs → OpenAI → Google TTS
  [TaskType.TextToSpeech]: ["elevenlabs", "openai-tts", "google-tts"],
  // Voice — Speech To Text: Whisper → Deepgram → Google Speech
  [TaskType.SpeechToText]: ["whisper", "deepgram", "google-speech"],
  // Conversational voice chat composes STT + chat + TTS; route it like chat.
  [TaskType.VoiceChat]: ["claude", "openai", "groq"],

  // Internet Search: OpenAI Search → Perplexity → Google Search
  [TaskType.InternetSearch]: ["openai-search", "perplexity", "google-search"],

  // Code Execution: Replit → Claude → Codex
  [TaskType.CodeExecution]: ["replit", "claude", "codex"],

  // Not covered by the spec's provider matrix — routed onto the general
  // reasoning chain so existing functionality keeps working unchanged.
  [TaskType.CodeReview]: ["claude", "openai", "groq"],
  [TaskType.BugFix]: ["claude", "openai", "groq"],
  [TaskType.DocumentAnalysis]: ["claude", "openai", "groq"],
  [TaskType.GeneralAI]: ["claude", "openai", "groq"],
};
