import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function EmptyState({ children, className, ...rest }: EmptyStateProps) {
  return <div className={cx("ab-empty ab-EmptyState", className)} {...rest}>{children}</div>;
}
