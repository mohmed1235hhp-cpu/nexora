import type { ReactNode } from "react";

export interface TaskListProps {
  children?: ReactNode;
  className?: string;
}

export function TaskList({ children, className }: TaskListProps) {
  return (
    <div className={`productivity-tasklist ${className ?? ""}`} data-template="productivity/TaskList">
      {children}
    </div>
  );
}
