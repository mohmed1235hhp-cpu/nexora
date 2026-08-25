import type { ReactNode } from "react";

export interface CalendarProps {
  children?: ReactNode;
  className?: string;
}

export function Calendar({ children, className }: CalendarProps) {
  return (
    <div className={`booking-calendar ${className ?? ""}`} data-template="booking/Calendar">
      {children}
    </div>
  );
}
