import type { ReactNode } from "react";

export interface ConfirmationDialogProps {
  children?: ReactNode;
  className?: string;
}

export function ConfirmationDialog({ children, className }: ConfirmationDialogProps) {
  return (
    <div className={`booking-confirmationdialog ${className ?? ""}`} data-template="booking/ConfirmationDialog">
      {children}
    </div>
  );
}
