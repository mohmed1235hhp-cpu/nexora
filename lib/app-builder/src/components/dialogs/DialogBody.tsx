import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface DialogBodyProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function DialogBody({ children, className, ...rest }: DialogBodyProps) {
  return <div className={cx("ab-dialogs ab-DialogBody", className)} {...rest}>{children}</div>;
}
