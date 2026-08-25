import type { ReactNode } from "react";

export interface KanbanBoardProps {
  children?: ReactNode;
  className?: string;
}

export function KanbanBoard({ children, className }: KanbanBoardProps) {
  return (
    <div className={`productivity-kanbanboard ${className ?? ""}`} data-template="productivity/KanbanBoard">
      {children}
    </div>
  );
}
