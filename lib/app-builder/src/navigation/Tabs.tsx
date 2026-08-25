import { Link } from "@tanstack/react-router";
import { NAV_ITEMS } from "./NavItems";
export function Tabs() {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b bg-card p-2 md:hidden">
      {NAV_ITEMS.map((n) => (
        <Link key={n.key} to={n.href} className="whitespace-nowrap rounded px-3 py-1.5 text-sm hover:bg-accent" activeProps={{ className: "bg-accent font-medium" }}>
          {n.icon} {n.label}
        </Link>
      ))}
    </nav>
  );
}
