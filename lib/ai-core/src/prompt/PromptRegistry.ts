import type { PromptTemplateDescriptor } from "../types/prompt.types";
import { PromptTemplate } from "./PromptTemplate";

export class PromptRegistry {
  private map = new Map<string, PromptTemplate>();
  register(d: PromptTemplateDescriptor): void {
    this.map.set(d.id, new PromptTemplate(d));
  }
  get(id: string): PromptTemplate | undefined {
    return this.map.get(id);
  }
  all(): PromptTemplate[] {
    return Array.from(this.map.values());
  }
}
