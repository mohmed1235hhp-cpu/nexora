import type { ReactNode } from "react";

export interface PomodoroTimerProps {
  children?: ReactNode;
  className?: string;
}

export function PomodoroTimer({ children, className }: PomodoroTimerProps) {
  return (
    <div className={`productivity-pomodorotimer ${className ?? ""}`} data-template="productivity/PomodoroTimer">
      {children}
    </div>
  );
}
