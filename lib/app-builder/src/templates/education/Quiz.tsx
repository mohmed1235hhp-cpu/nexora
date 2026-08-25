import type { ReactNode } from "react";

export interface QuizProps {
  children?: ReactNode;
  className?: string;
}

export function Quiz({ children, className }: QuizProps) {
  return (
    <div className={`education-quiz ${className ?? ""}`} data-template="education/Quiz">
      {children}
    </div>
  );
}
