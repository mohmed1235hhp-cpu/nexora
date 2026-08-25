import type { PromptTemplateDescriptor } from "../types/prompt.types";

export class PromptVersioning {
  private versions = new Map<string, PromptTemplateDescriptor[]>();
  add(t: PromptTemplateDescriptor): void {
    const list = this.versions.get(t.id) ?? [];
    list.push(t);
    this.versions.set(t.id, list);
  }
  latest(id: string): PromptTemplateDescriptor | undefined {
    const list = this.versions.get(id);
    return list?.[list.length - 1];
  }
}
