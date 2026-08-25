import type { SelectHTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx("h-10 w-full rounded-md border border-input bg-background px-3 text-sm", className)} {...rest}>{children}</select>;
}
