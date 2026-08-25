import type { ReactNode } from "react";

export interface ClientListProps {
  children?: ReactNode;
  className?: string;
}

export function ClientList({ children, className }: ClientListProps) {
  return (
    <div className={`business-clientlist ${className ?? ""}`} data-template="business/ClientList">
      {children}
    </div>
  );
}
