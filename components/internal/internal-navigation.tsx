"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "./internal-ui";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ventas", label: "Ventas" },
  { href: "/productos", label: "Productos" },
  { href: "/clientes", label: "Clientes" },
  { href: "/usuarios", label: "Usuarios" },
];

export default function InternalNavigation({ canViewUsers = false }: { canViewUsers?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1.5">
      {items
        .filter((item) => canViewUsers || item.href !== "/usuarios")
        .map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              isActive
                ? "bg-emerald-500/10 text-emerald-200 ring-1 ring-inset ring-emerald-500/20"
                : "text-slate-300 hover:bg-slate-800/70 hover:text-slate-50"
            )}
          >
            <span>{item.label}</span>
            {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : null}
          </Link>
        );
        })}
    </nav>
  );
}
