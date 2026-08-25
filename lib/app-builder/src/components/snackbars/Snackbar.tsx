import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface SnackbarProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function Snackbar({ children, className, ...rest }: SnackbarProps) {
  return <div className={cx("ab-snackbars ab-Snackbar", className)} {...rest}>{children}</div>;
}
