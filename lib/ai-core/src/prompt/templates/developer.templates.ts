import type { PromptTemplateDescriptor } from "../../types/prompt.types";

export const DEVELOPER_TEMPLATES: PromptTemplateDescriptor[] = [
  {
    id: "developer.default",
    version: "1.0.0",
    role: "developer",
    template: "Follow safety and formatting guidelines.",
    variables: [],
  },
];
