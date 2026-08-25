import { registerJobWorker } from "./jobs";
import { geminiChat, videoGenerate } from "./providers";

interface WebsiteJobInput {
  description: string;
  style?: string;
  sections?: string;
}
interface AppJobInput {
  description: string;
  framework?: string;
  features?: string;
}
interface VideoJobInput {
  prompt: string;
  durationSeconds?: number;
}

/**
 * Registers the background workers for every heavy operation queue. Called
 * once at server startup (see index.ts). Progress here is intentionally
 * coarse (25/75/100) rather than a fabricated fine-grained percentage —
 * these are single-call generations under the hood, so there's no real
 * incremental signal to report between "started" and "done" yet.
 */
export function registerAllJobWorkers(): void {
  registerJobWorker<WebsiteJobInput, string>("website-build", async (input, onProgress) => {
    onProgress(25);
    const result = await geminiChat([
      { role: "system", content: "أنت مطور ويب خبير. أنشئ كود HTML و CSS و JavaScript كاملاً وجاهزاً للاستخدام في ملف واحد. الكود يجب أن يكون جميلاً ومتجاوباً. أعد الكود فقط بدون أي شرح خارج كتلة الكود." },
      { role: "user", content: `أنشئ موقع ويب كامل في ملف HTML واحد عن: ${input.description}${input.style ? `\nالأسلوب: ${input.style}` : ""}${input.sections ? `\nالأقسام: ${input.sections}` : ""}` },
    ], { thinking: true, temperature: 0.12 });
    onProgress(90);
    return result;
  });

  registerJobWorker<AppJobInput, string>("app-build", async (input, onProgress) => {
    onProgress(25);
    const result = await geminiChat([
      { role: "system", content: "أنت مطور تطبيقات خبير. أنشئ كود تطبيق كامل ومنظم وجاهز للتشغيل، مقسّم إلى ملفات واضحة إن لزم الأمر." },
      { role: "user", content: `أنشئ تطبيقاً ${input.framework ? `باستخدام ${input.framework}` : ""} بالمواصفات التالية:\n${input.description}${input.features ? `\nالميزات: ${input.features}` : ""}` },
    ], { thinking: true, temperature: 0.12 });
    onProgress(90);
    return result;
  });

  registerJobWorker<VideoJobInput, { url: string }>("video", async (input, onProgress) => {
    onProgress(20);
    const url = await videoGenerate(input.prompt, input.durationSeconds ?? 5);
    onProgress(95);
    return { url };
  });
}
