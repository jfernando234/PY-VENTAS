import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-lg font-bold tracking-tight">Sistema de Ventas</h1>
          <p className="text-xs text-gray-400 mt-1">{session.user.nombre}</p>
          <span className="inline-block mt-1 text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
            {session.user.rol}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/dashboard"
            className="block px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/ventas"
            className="block px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            Ventas
          </Link>
          <Link
            href="/productos"
            className="block px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            Productos
          </Link>
          <Link
            href="/clientes"
            className="block px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            Clientes
          </Link>
          {session.user.rol === "ADMINISTRADOR" && (
            <Link
              href="/usuarios"
              className="block px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              Usuarios
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full px-3 py-2 rounded text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors text-left"
            >
              Cerrar sesion
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
