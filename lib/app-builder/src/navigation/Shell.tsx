import type { ReactNode } from "react";
import { Drawer } from "./Drawer";
import { Tabs } from "./Tabs";
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <Drawer />
        <div className="flex min-h-screen flex-1 flex-col">
          <Tabs />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
