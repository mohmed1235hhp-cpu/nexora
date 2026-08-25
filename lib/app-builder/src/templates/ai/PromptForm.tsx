import type { ReactNode } from "react";

export interface PromptFormProps {
  children?: ReactNode;
  className?: string;
}

export function PromptForm({ children, className }: PromptFormProps) {
  return (
    <div className={`ai-promptform ${className ?? ""}`} data-template="ai/PromptForm">
      {children}
    </div>
  );
}
