import type { ReactNode } from "react";

export interface HeaderProps {
  children?: ReactNode;
  className?: string;
}

export function Header({ children, className }: HeaderProps) {
  return (
    <div className={`shared-header ${className ?? ""}`} data-template="shared/Header">
      {children}
    </div>
  );
}
