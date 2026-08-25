import type { ReactNode } from "react";

export interface RegisterProps {
  children?: ReactNode;
  className?: string;
}

export function Register({ children, className }: RegisterProps) {
  return (
    <div className={`pos-register ${className ?? ""}`} data-template="pos/Register">
      {children}
    </div>
  );
}
