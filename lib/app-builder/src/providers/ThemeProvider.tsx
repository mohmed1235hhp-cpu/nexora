import type { ReactNode } from "react";
export function ThemeProvider({ children }: { children: ReactNode }) { return <div data-app-builder-theme>{children}</div>; }
