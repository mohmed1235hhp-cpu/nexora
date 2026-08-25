import type { ReactNode } from "react";

export interface EmptyStateProps {
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ children, className }: EmptyStateProps) {
  return (
    <div className={`shared-emptystate ${className ?? ""}`} data-template="shared/EmptyState">
      {children}
    </div>
  );
}
