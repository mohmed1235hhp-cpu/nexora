import type { ReactNode } from "react";

export interface CoursePageProps {
  children?: ReactNode;
  className?: string;
}

export function CoursePage({ children, className }: CoursePageProps) {
  return (
    <div className={`education-coursepage ${className ?? ""}`} data-template="education/CoursePage">
      {children}
    </div>
  );
}
