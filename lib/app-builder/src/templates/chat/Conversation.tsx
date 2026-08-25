import type { ReactNode } from "react";

export interface ConversationProps {
  children?: ReactNode;
  className?: string;
}

export function Conversation({ children, className }: ConversationProps) {
  return (
    <div className={`chat-conversation ${className ?? ""}`} data-template="chat/Conversation">
      {children}
    </div>
  );
}
