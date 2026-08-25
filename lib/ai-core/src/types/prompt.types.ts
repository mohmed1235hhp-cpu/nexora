export type PromptRole = "system" | "user" | "developer" | "assistant";

export interface PromptMessage {
  role: PromptRole;
  content: string;
  name?: string;
}

export interface PromptTemplateDescriptor {
  id: string;
  version: string;
  role: PromptRole;
  template: string;
  variables: string[];
}
