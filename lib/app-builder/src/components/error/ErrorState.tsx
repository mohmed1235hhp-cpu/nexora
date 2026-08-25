import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function ErrorState({ children, className, ...rest }: ErrorStateProps) {
  return <div className={cx("ab-error ab-ErrorState", className)} {...rest}>{children}</div>;
}
