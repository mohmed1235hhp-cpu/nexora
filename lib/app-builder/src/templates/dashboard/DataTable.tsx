import type { ReactNode } from "react";

export interface DataTableProps {
  children?: ReactNode;
  className?: string;
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div className={`dashboard-datatable ${className ?? ""}`} data-template="dashboard/DataTable">
      {children}
    </div>
  );
}
