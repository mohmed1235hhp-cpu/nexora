import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function ProgressBar({ children, className, ...rest }: ProgressBarProps) {
  return <div className={cx("ab-progress ab-ProgressBar", className)} {...rest}>{children}</div>;
}
