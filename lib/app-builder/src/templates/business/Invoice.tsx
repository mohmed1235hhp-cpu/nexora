import type { ReactNode } from "react";

export interface InvoiceProps {
  children?: ReactNode;
  className?: string;
}

export function Invoice({ children, className }: InvoiceProps) {
  return (
    <div className={`business-invoice ${className ?? ""}`} data-template="business/Invoice">
      {children}
    </div>
  );
}
