import type { ReactNode } from "react";

export interface ResponseStreamProps {
  children?: ReactNode;
  className?: string;
}

export function ResponseStream({ children, className }: ResponseStreamProps) {
  return (
    <div className={`ai-responsestream ${className ?? ""}`} data-template="ai/ResponseStream">
      {children}
    </div>
  );
}
