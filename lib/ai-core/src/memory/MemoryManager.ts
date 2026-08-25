import { ShortMemory } from "./ShortMemory";
import { LongMemory } from "./LongMemory";
import { ConversationMemory } from "./ConversationMemory";
import { TemporaryContext } from "./TemporaryContext";
import { ProjectContext } from "./ProjectContext";

export class MemoryManager {
  readonly short = new ShortMemory();
  readonly long = new LongMemory();
  readonly conversation = new ConversationMemory();
  readonly temporary = new TemporaryContext();
  readonly project = new ProjectContext();
}
