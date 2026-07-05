import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import InternalNavigation from "@/components/internal/internal-navigation";
import { InternalBadge, cn, internalPageClassName } from "@/components/internal/internal-ui";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.activo) {
    redirect("/login");
  }

  return (
    <div className={cn(internalPageClassName, "flex min-h-screen flex-col lg:flex-row")}>
      <aside className="flex w-full flex-col border-b border-slate-800 bg-slate-950/95 px-4 py-5 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.45)] lg:w-72 lg:border-b-0 lg:border-r">
        <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 6.75A2.75 2.75 0 016.75 4h10.5A2.75 2.75 0 0120 6.75v10.5A2.75 2.75 0 0117.25 20H6.75A2.75 2.75 0 014 17.25V6.75zM7 8h10M7 12h5m-5 4h3"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-50">Sistema de Ventas</h1>
              <p className="text-xs text-slate-400">{session.user.nombre}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <InternalBadge tone="accent">{session.user.rol}</InternalBadge>
            <InternalBadge tone={session.user.activo ? "success" : "warning"}>
              {session.user.activo ? "Activo" : "Inactivo"}
            </InternalBadge>
          </div>
        </div>

        <div className="mt-5 flex-1 rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-3 lg:min-h-0">
          <p className="px-3 pb-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Navegación
          </p>
          <InternalNavigation canViewUsers={session.user.rol === "ADMINISTRADOR"} />
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Sesión</p>
          <p className="mt-2 text-sm text-slate-300">{session.user.email}</p>
          <form action="/api/auth/signout" method="POST" className="mt-4">
            <button
              type="submit"
              className={cn(
                "w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-left text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              )}
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.96),_rgba(2,6,23,1)_62%)]">
        {children}
      </main>
    </div>
  );
}
