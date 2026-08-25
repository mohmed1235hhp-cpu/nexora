import { InMemoryMediaCache } from "./MediaCache.js";
export class DocumentCache extends InMemoryMediaCache<{ text: string; pages?: string[] }> {}
