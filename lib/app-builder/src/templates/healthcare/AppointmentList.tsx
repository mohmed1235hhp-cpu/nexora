import type { ReactNode } from "react";

export interface AppointmentListProps {
  children?: ReactNode;
  className?: string;
}

export function AppointmentList({ children, className }: AppointmentListProps) {
  return (
    <div className={`healthcare-appointmentlist ${className ?? ""}`} data-template="healthcare/AppointmentList">
      {children}
    </div>
  );
}
