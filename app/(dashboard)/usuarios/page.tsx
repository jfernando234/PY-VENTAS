import { prisma } from "@/lib/prisma";
import {
  InternalBadge,
  InternalEmptyState,
  InternalPageHeader,
  InternalPageShell,
  InternalSection,
} from "@/components/internal/internal-ui";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.rol !== "ADMINISTRADOR") {
    redirect("/dashboard");
  }

  const usuarios = await prisma.usuario.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
    },
  });

  return (
    <InternalPageShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <InternalPageHeader
          eyebrow="Administración"
          title="Usuarios"
          description="Vista operativa de las cuentas internas que pueden acceder al sistema."
        />

        <InternalSection
          eyebrow="Acceso interno"
          title="Cuentas del sistema"
          description="Listado de usuarios con rol y estado activo."
          action={<InternalBadge tone="accent">{usuarios.length} usuarios</InternalBadge>}
        >
          <div className="overflow-hidden rounded-b-[1.75rem]">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950/70 text-slate-400">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold sm:px-6">Usuario</th>
                  <th className="px-5 py-3 text-left font-semibold sm:px-6">Email</th>
                  <th className="px-5 py-3 text-left font-semibold sm:px-6">Rol</th>
                  <th className="px-5 py-3 text-left font-semibold sm:px-6">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/70">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="transition-colors hover:bg-slate-800/70">
                    <td className="px-5 py-4 font-medium text-slate-50 sm:px-6">{usuario.nombre}</td>
                    <td className="px-5 py-4 text-slate-300 sm:px-6">{usuario.email}</td>
                    <td className="px-5 py-4 text-slate-300 sm:px-6">
                      <InternalBadge tone="accent">{usuario.rol}</InternalBadge>
                    </td>
                    <td className="px-5 py-4 text-slate-300 sm:px-6">
                      <InternalBadge tone={usuario.activo ? "success" : "warning"}>
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </InternalBadge>
                    </td>
                  </tr>
                ))}

                {!usuarios.length && (
                  <tr>
                    <td className="px-5 py-6 sm:px-6" colSpan={4}>
                      <InternalEmptyState
                        title="No hay usuarios cargados."
                        description="La tabla se llenará cuando existan cuentas internas en la base de datos."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </InternalSection>
      </div>
    </InternalPageShell>
  );
}
