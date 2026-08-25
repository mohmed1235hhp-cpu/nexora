import { Link } from "@tanstack/react-router";
import { NAV_ITEMS } from "./NavItems";
export function Drawer() {
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-card p-3 md:block">
      <div className="mb-4 text-lg font-bold">App Builder</div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((n) => (
          <Link key={n.key} to={n.href} className="rounded px-2 py-1.5 text-sm hover:bg-accent" activeProps={{ className: "bg-accent font-medium" }}>
            <span className="me-2">{n.icon}</span>{n.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
