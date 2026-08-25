import type { ReactNode } from "react";

export interface SlotPickerProps {
  children?: ReactNode;
  className?: string;
}

export function SlotPicker({ children, className }: SlotPickerProps) {
  return (
    <div className={`booking-slotpicker ${className ?? ""}`} data-template="booking/SlotPicker">
      {children}
    </div>
  );
}
