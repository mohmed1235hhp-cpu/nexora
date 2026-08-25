import type { ReactNode } from "react";

export interface MessageBubbleProps {
  children?: ReactNode;
  className?: string;
}

export function MessageBubble({ children, className }: MessageBubbleProps) {
  return (
    <div className={`chat-messagebubble ${className ?? ""}`} data-template="chat/MessageBubble">
      {children}
    </div>
  );
}
