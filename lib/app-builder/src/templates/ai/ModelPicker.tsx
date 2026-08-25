import type { ReactNode } from "react";

export interface ModelPickerProps {
  children?: ReactNode;
  className?: string;
}

export function ModelPicker({ children, className }: ModelPickerProps) {
  return (
    <div className={`ai-modelpicker ${className ?? ""}`} data-template="ai/ModelPicker">
      {children}
    </div>
  );
}
