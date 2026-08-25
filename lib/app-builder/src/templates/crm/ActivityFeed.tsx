import type { ReactNode } from "react";

export interface ActivityFeedProps {
  children?: ReactNode;
  className?: string;
}

export function ActivityFeed({ children, className }: ActivityFeedProps) {
  return (
    <div className={`crm-activityfeed ${className ?? ""}`} data-template="crm/ActivityFeed">
      {children}
    </div>
  );
}
