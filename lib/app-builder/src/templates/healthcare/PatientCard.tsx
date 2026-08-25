import type { ReactNode } from "react";

export interface PatientCardProps {
  children?: ReactNode;
  className?: string;
}

export function PatientCard({ children, className }: PatientCardProps) {
  return (
    <div className={`healthcare-patientcard ${className ?? ""}`} data-template="healthcare/PatientCard">
      {children}
    </div>
  );
}
