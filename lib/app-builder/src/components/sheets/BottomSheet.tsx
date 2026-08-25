import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface BottomSheetProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function BottomSheet({ children, className, ...rest }: BottomSheetProps) {
  return <div className={cx("ab-sheets ab-BottomSheet", className)} {...rest}>{children}</div>;
}
