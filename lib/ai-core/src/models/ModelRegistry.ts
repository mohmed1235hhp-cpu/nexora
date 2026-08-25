import type { ModelDescriptor } from "../types/model.types";
import { MODELS_CONFIG } from "../config/models.config";

export class ModelRegistry {
  private models = new Map<string, ModelDescriptor>();
  constructor(initial: ModelDescriptor[] = MODELS_CONFIG) {
    initial.forEach((m) => this.models.set(m.id, m));
  }
  get(id: string): ModelDescriptor | undefined {
    return this.models.get(id);
  }
  all(): ModelDescriptor[] {
    return Array.from(this.models.values());
  }
}
