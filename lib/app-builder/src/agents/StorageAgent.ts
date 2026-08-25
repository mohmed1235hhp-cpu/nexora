import { BaseAgent, type AgentContext } from "./BaseAgent";
import { storageSchema } from "../ai/schemas/storage.schema";
import { storageSystemPrompt, buildStoragePrompt } from "../ai/prompts/storage.prompt";

export class StorageAgent extends BaseAgent<typeof storageSchema> {
  readonly name = "StorageAgent";
  readonly task = "storage";
  protected schema = storageSchema;
  protected system = storageSystemPrompt;
  protected buildPrompt(ctx: AgentContext) {
    return buildStoragePrompt(ctx.spec);
  }
}
// Generates storage adapters
