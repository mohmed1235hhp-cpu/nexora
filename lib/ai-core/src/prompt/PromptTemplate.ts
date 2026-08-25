import type { PromptTemplateDescriptor } from "../types/prompt.types";

export class PromptTemplate {
  constructor(public descriptor: PromptTemplateDescriptor) {}
  render(vars: Record<string, string> = {}): string {
    return this.descriptor.template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? "");
  }
}
