import { PromptRegistry } from "./PromptRegistry";
import { PromptValidator } from "./PromptValidator";
import { PromptVersioning } from "./PromptVersioning";
import { VariableResolver } from "./VariableResolver";
import { SYSTEM_TEMPLATES } from "./templates/system.templates";
import { USER_TEMPLATES } from "./templates/user.templates";
import { DEVELOPER_TEMPLATES } from "./templates/developer.templates";

export class PromptManager {
  readonly registry = new PromptRegistry();
  readonly validator = new PromptValidator();
  readonly versioning = new PromptVersioning();
  readonly variables = new VariableResolver();

  constructor() {
    [...SYSTEM_TEMPLATES, ...USER_TEMPLATES, ...DEVELOPER_TEMPLATES].forEach((t) => {
      this.registry.register(t);
      this.versioning.add(t);
    });
  }

  render(id: string, vars: Record<string, unknown> = {}): string {
    const tpl = this.registry.get(id);
    if (!tpl) throw new Error(`Prompt template not found: ${id}`);
    return tpl.render(this.variables.resolve(vars));
  }
}
