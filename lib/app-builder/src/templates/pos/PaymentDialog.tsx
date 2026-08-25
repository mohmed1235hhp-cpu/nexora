import type { ReactNode } from "react";

export interface PaymentDialogProps {
  children?: ReactNode;
  className?: string;
}

export function PaymentDialog({ children, className }: PaymentDialogProps) {
  return (
    <div className={`pos-paymentdialog ${className ?? ""}`} data-template="pos/PaymentDialog">
      {children}
    </div>
  );
}
