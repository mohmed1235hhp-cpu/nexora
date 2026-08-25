import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface LoadingProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function Loading({ children, className, ...rest }: LoadingProps) {
  return <div className={cx("ab-loading ab-Loading", className)} {...rest}>{children}</div>;
}
