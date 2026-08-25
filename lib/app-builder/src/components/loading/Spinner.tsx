import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function Spinner({ children, className, ...rest }: SpinnerProps) {
  return <div className={cx("ab-loading ab-Spinner", className)} {...rest}>{children}</div>;
}
