import type { PromptTemplateDescriptor } from "../../types/prompt.types";

export const USER_TEMPLATES: PromptTemplateDescriptor[] = [
  {
    id: "user.echo",
    version: "1.0.0",
    role: "user",
    template: "{{message}}",
    variables: ["message"],
  },
];
