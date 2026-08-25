import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface DialogProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function Dialog({ children, className, ...rest }: DialogProps) {
  return <div className={cx("ab-dialogs ab-Dialog", className)} {...rest}>{children}</div>;
}
