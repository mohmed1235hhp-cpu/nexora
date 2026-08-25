import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface SnackbarHostProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function SnackbarHost({ children, className, ...rest }: SnackbarHostProps) {
  return <div className={cx("ab-snackbars ab-SnackbarHost", className)} {...rest}>{children}</div>;
}
