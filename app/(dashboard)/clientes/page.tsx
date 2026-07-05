import { listarClientes } from "@/lib/sales";
import {
  InternalBadge,
  InternalEmptyState,
  InternalPageHeader,
  InternalPageShell,
  InternalSection,
} from "@/components/internal/internal-ui";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clientes = await listarClientes();

  return (
    <InternalPageShell>
      <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <InternalPageHeader
          eyebrow="Relación comercial"
          title="Clientes"
          description="Listado base de clientes para el proceso de ventas y seguimiento interno."
        />

        <InternalSection
          eyebrow="Base de clientes"
          title="Registro activo"
          description="Clientes disponibles para seleccionar durante la venta."
          action={<InternalBadge tone="accent">{clientes.length} clientes</InternalBadge>}
        >
          <div className="overflow-hidden rounded-b-[1.75rem]">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950/70 text-slate-400">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold sm:px-6">Cliente</th>
                  <th className="px-5 py-3 text-left font-semibold sm:px-6">DNI</th>
                  <th className="px-5 py-3 text-left font-semibold sm:px-6">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/70">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="transition-colors hover:bg-slate-800/70">
                    <td className="px-5 py-4 font-medium text-slate-50 sm:px-6">{cliente.nombre}</td>
                    <td className="px-5 py-4 text-slate-300 sm:px-6">{cliente.dni}</td>
                    <td className="px-5 py-4 text-slate-300 sm:px-6">
                      <div>{cliente.telefono ?? "-"}</div>
                      <div className="text-xs text-slate-400">{cliente.email ?? ""}</div>
                    </td>
                  </tr>
                ))}

                {!clientes.length && (
                  <tr>
                    <td className="px-5 py-6 sm:px-6" colSpan={3}>
                      <InternalEmptyState
                        title="No hay clientes cargados."
                        description="Los clientes creados desde la venta o por API aparecerán acá."
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
