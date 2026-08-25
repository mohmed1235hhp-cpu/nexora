import type { PromptTemplateDescriptor } from "../types/prompt.types";

export class PromptValidator {
  validate(d: PromptTemplateDescriptor): string[] {
    const errors: string[] = [];
    if (!d.id) errors.push("id required");
    if (!d.template) errors.push("template required");
    const declared = new Set(d.variables);
    const found = new Set<string>();
    for (const m of d.template.matchAll(/\{\{(\w+)\}\}/g)) found.add(m[1]);
    for (const v of found) if (!declared.has(v)) errors.push(`undeclared variable: ${v}`);
    return errors;
  }
}
