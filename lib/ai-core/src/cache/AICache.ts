import { PromptCache } from "./PromptCache";
import { ResponseCache } from "./ResponseCache";
import { EmbeddingCache } from "./EmbeddingCache";
import { TemporaryCache } from "./TemporaryCache";

export class AICache {
  readonly prompt = new PromptCache<string>();
  readonly response = new ResponseCache<unknown>();
  readonly embedding = new EmbeddingCache<number[]>();
  readonly temporary = new TemporaryCache<unknown>();
}
