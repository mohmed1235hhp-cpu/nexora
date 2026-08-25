import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function DialogFooter({ children, className, ...rest }: DialogFooterProps) {
  return <div className={cx("ab-dialogs ab-DialogFooter", className)} {...rest}>{children}</div>;
}
