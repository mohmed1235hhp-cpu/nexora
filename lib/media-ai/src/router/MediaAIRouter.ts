// MediaAIRouter — provider-agnostic dispatcher.
// Pluggable providers per capability; no direct SDK imports.
import type {
  IImageProvider, IVoiceProvider, IOCRProvider, IDocumentProvider, IStorageProvider,
} from "../shared/interfaces/index.js";
import { MediaError } from "../errors/MediaError.js";

export interface MediaProviders {
  image?: IImageProvider[];
  voice?: IVoiceProvider[];
  ocr?: IOCRProvider[];
  documents?: IDocumentProvider[];
  storage?: IStorageProvider[];
}

export type Capability = "image" | "voice" | "ocr" | "documents" | "storage";

export class MediaAIRouter {
  constructor(private providers: MediaProviders = {}) {}

  register<K extends Capability>(cap: K, provider: NonNullable<MediaProviders[K]>[number]): void {
    const list = (this.providers[cap] ?? []) as NonNullable<MediaProviders[K]>;
    (list as unknown as Array<typeof provider>).push(provider);
    (this.providers as Record<string, unknown[]>)[cap] = list as unknown as unknown[];
  }

  pickImage(): IImageProvider {
    const p = this.providers.image?.[0];
    if (!p) throw new MediaError("NO_IMAGE_PROVIDER", "no image provider registered");
    return p;
  }
  pickVoice(): IVoiceProvider {
    const p = this.providers.voice?.[0];
    if (!p) throw new MediaError("NO_VOICE_PROVIDER", "no voice provider registered");
    return p;
  }
  pickOCR(): IOCRProvider {
    const p = this.providers.ocr?.[0];
    if (!p) throw new MediaError("NO_OCR_PROVIDER", "no OCR provider registered");
    return p;
  }
  pickDocument(mime: string): IDocumentProvider {
    const p = this.providers.documents?.find((d) => d.supports(mime));
    if (!p) throw new MediaError("NO_DOC_PROVIDER", `no document provider for ${mime}`);
    return p;
  }
  pickStorage(): IStorageProvider {
    const p = this.providers.storage?.[0];
    if (!p) throw new MediaError("NO_STORAGE_PROVIDER", "no storage provider registered");
    return p;
  }
}
