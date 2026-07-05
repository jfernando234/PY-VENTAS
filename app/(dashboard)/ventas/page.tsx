import Link from "next/link";
import { listarVentas } from "@/lib/sales";
import {
  InternalBadge,
  InternalEmptyState,
  InternalPageShell,
  InternalPageHeader,
  InternalSection,
  internalPrimaryButtonClassName,
} from "@/components/internal/internal-ui";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function VentasPage() {
  const ventas = await listarVentas(20);

  return (
    <InternalPageShell>
      <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <InternalPageHeader
          eyebrow="Operación comercial"
          title="Ventas"
          description="Revisá las últimas ventas y abrí un comprobante cuando lo necesites."
          actions={
            <Link href="/ventas/nueva" className={internalPrimaryButtonClassName}>
              Nueva venta
            </Link>
          }
        />

        <InternalSection
          eyebrow="Registro diario"
          title="Últimos comprobantes"
          description="Historial reciente con cliente, fecha, pago, ítems y total."
          action={<InternalBadge tone="accent">{ventas.length} ventas</InternalBadge>}
        >
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full table-fixed border-separate border-spacing-0 text-sm">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[22%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Comprobante</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Cliente</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Fecha</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Pago</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Ítems</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-right font-semibold sm:px-6">Total</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-right font-semibold sm:px-6">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/70">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="transition-colors hover:bg-slate-800/70">
                    <td className="px-5 py-4 align-top sm:px-6">
                      <div className="font-medium text-slate-50">{venta.comprobante} #{venta.id}</div>
                      <div className="text-xs text-slate-400">Atendido por {venta.usuario.nombre}</div>
                    </td>
                    <td className="px-5 py-4 align-top text-slate-300 sm:px-6">
                      <div className="font-medium text-slate-50">{venta.cliente.nombre}</div>
                      <div className="text-xs text-slate-400">DNI {venta.cliente.dni}</div>
                    </td>
                    <td className="px-5 py-4 align-top text-slate-300 sm:px-6">
                      <div>{formatDate(venta.createdAt)}</div>
                      <div className="text-xs text-slate-400">Subtotal {money(venta.subtotal)}</div>
                    </td>
                    <td className="px-5 py-4 align-top sm:px-6">
                      <InternalBadge>{venta.metodoPago}</InternalBadge>
                    </td>
                    <td className="px-5 py-4 align-top text-slate-300 sm:px-6">{venta.itemsCount}</td>
                    <td className="px-5 py-4 align-top text-right font-medium text-slate-50 sm:px-6">
                      {money(venta.total)}
                    </td>
                    <td className="px-5 py-4 align-top text-right sm:px-6">
                      <Link href={`/ventas/${venta.id}`} className="font-semibold text-emerald-200 transition-colors hover:text-emerald-100">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
                {!ventas.length && (
                  <tr>
                    <td className="px-5 py-6 sm:px-6" colSpan={7}>
                      <InternalEmptyState
                        title="No hay ventas registradas todavía."
                        description="La primera operación aparecerá acá apenas se complete una venta."
                        action={
                          <Link href="/ventas/nueva" className={internalPrimaryButtonClassName}>
                            Crear venta
                          </Link>
                        }
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
