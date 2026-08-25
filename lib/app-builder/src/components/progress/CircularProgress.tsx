import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface CircularProgressProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function CircularProgress({ children, className, ...rest }: CircularProgressProps) {
  return <div className={cx("ab-progress ab-CircularProgress", className)} {...rest}>{children}</div>;
}
