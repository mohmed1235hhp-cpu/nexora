import { InMemoryMediaCache } from "./MediaCache.js";
import type { MediaRef } from "../types/media.js";
export class ImageCache extends InMemoryMediaCache<MediaRef> {}
