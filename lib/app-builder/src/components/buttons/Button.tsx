import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../../utils/classnames";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary"|"secondary"|"ghost"|"danger";
  size?: "sm"|"md"|"lg";
  loading?: boolean;
  children?: ReactNode;
}
export function Button({ variant="primary", size="md", loading, className, children, disabled, ...rest }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const v = { primary: "bg-primary text-primary-foreground hover:bg-primary/90", secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80", ghost: "hover:bg-accent hover:text-accent-foreground", danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90" }[variant];
  const s = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" }[size];
  return <button className={cx(base, v, s, className)} disabled={disabled || loading} {...rest}>{loading ? "..." : children}</button>;
}
