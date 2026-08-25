import type { PromptTemplateDescriptor } from "../../types/prompt.types";

export const SYSTEM_TEMPLATES: PromptTemplateDescriptor[] = [
  {
    id: "system.default",
    version: "1.0.0",
    role: "system",
    template: "You are a helpful AI assistant.",
    variables: [],
  },
];
