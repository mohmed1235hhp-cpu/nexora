import type { ReactNode } from "react";

export interface FooterProps {
  children?: ReactNode;
  className?: string;
}

export function Footer({ children, className }: FooterProps) {
  return (
    <div className={`shared-footer ${className ?? ""}`} data-template="shared/Footer">
      {children}
    </div>
  );
}
