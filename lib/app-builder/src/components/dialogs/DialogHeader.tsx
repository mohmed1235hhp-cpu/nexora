import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function DialogHeader({ children, className, ...rest }: DialogHeaderProps) {
  return <div className={cx("ab-dialogs ab-DialogHeader", className)} {...rest}>{children}</div>;
}
