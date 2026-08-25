import type { ReactNode } from "react";

export interface ErrorStateProps {
  children?: ReactNode;
  className?: string;
}

export function ErrorState({ children, className }: ErrorStateProps) {
  return (
    <div className={`shared-errorstate ${className ?? ""}`} data-template="shared/ErrorState">
      {children}
    </div>
  );
}
