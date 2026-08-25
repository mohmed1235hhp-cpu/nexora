import type { ReactNode } from "react";

export interface LoadingStateProps {
  children?: ReactNode;
  className?: string;
}

export function LoadingState({ children, className }: LoadingStateProps) {
  return (
    <div className={`shared-loadingstate ${className ?? ""}`} data-template="shared/LoadingState">
      {children}
    </div>
  );
}
