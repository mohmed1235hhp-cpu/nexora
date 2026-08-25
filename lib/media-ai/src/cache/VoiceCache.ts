import { InMemoryMediaCache } from "./MediaCache.js";
import type { MediaRef } from "../types/media.js";
export class VoiceCache extends InMemoryMediaCache<MediaRef> {}
