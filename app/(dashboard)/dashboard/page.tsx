import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listarProductosBajoStock,
  obtenerProductosMasVendidosHoy,
  obtenerResumenVentasHoy,
} from "@/lib/sales";
import {
  InternalBadge,
  InternalMetricCard,
  InternalPageShell,
  InternalSection,
  internalPrimaryButtonClassName,
  internalSecondaryButtonClassName,
} from "@/components/internal/internal-ui";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShortage(producto: { stock: number; stockMinimo: number }) {
  return Math.max(0, producto.stockMinimo - producto.stock);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const [resumen, productosBajoStock, productosMasVendidos] = await Promise.all([
    obtenerResumenVentasHoy(),
    listarProductosBajoStock(5),
    obtenerProductosMasVendidosHoy(),
  ]);

  const metricasSecundarias = [
    {
      label: "Ventas de hoy",
      value: String(resumen.ventasCount),
      detail: "Comprobantes emitidos",
    },
    {
      label: "Ticket promedio",
      value: money(resumen.promedioTicket),
      detail: "Promedio neto por venta",
    },
    {
      label: "Descuentos aplicados",
      value: money(resumen.descuentos),
      detail: "Total descontado hoy",
    },
  ];

  return (
    <InternalPageShell>
      <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/95">
          <div className="grid gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.95fr)] lg:px-6 lg:py-7">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <InternalBadge tone="success">Panel operativo</InternalBadge>
                <InternalBadge tone="neutral">{resumen.ventasCount} comprobantes</InternalBadge>
                <InternalBadge tone={productosBajoStock.length ? "warning" : "neutral"}>
                  {productosBajoStock.length} alertas de stock
                </InternalBadge>
              </div>

              <div className="space-y-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Jornada activa
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
                  Dashboard
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Bienvenido, {session?.user.nombre ?? "usuario"}. Hoy llevás {resumen.ventasCount} ventas registradas y el flujo de caja está activo.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/ventas/nueva" className={internalPrimaryButtonClassName}>
                  Nueva venta
                </Link>
                <Link href="/ventas" className={internalSecondaryButtonClassName}>
                  Ver ventas
                </Link>
              </div>
            </div>

            <aside className="rounded-[1.5rem] border border-slate-800 bg-slate-950/60 p-5">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Estado de la jornada
              </p>
              <dl className="mt-4 space-y-3">
                <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                  <div>
                    <dt className="text-sm text-slate-400">Ventas de hoy</dt>
                    <dd className="mt-1 text-xl font-semibold tracking-tight text-slate-50">{resumen.ventasCount}</dd>
                  </div>
                  <InternalBadge tone="success">Activo</InternalBadge>
                </div>
                <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                  <div>
                    <dt className="text-sm text-slate-400">Productos en alerta</dt>
                    <dd className="mt-1 text-xl font-semibold tracking-tight text-slate-50">{productosBajoStock.length}</dd>
                  </div>
                  <InternalBadge tone={productosBajoStock.length ? "warning" : "neutral"}>
                    {productosBajoStock.length > 0 ? "Revisar" : "OK"}
                  </InternalBadge>
                </div>
                <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                  <div>
                    <dt className="text-sm text-slate-400">Ítems vendidos</dt>
                    <dd className="mt-1 text-xl font-semibold tracking-tight text-slate-50">{resumen.itemsVendidos}</dd>
                  </div>
                  <InternalBadge tone="accent">{productosMasVendidos.length} top</InternalBadge>
                </div>
              </dl>
            </aside>
          </div>

          <div className="border-t border-slate-800 px-5 py-5 sm:px-6">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,1fr))]">
              <InternalMetricCard
                label="Total vendido hoy"
                value={money(resumen.totalNeto)}
                detail={`${resumen.itemsVendidos} unidades vendidas, neto consolidado de la jornada.`}
                emphasis
                tone="accent"
              />
              {metricasSecundarias.map((metrica) => (
                <InternalMetricCard
                  key={metrica.label}
                  label={metrica.label}
                  value={metrica.value}
                  detail={metrica.detail}
                />
              ))}
            </div>
          </div>
        </section>

        <InternalSection
          eyebrow="Movimiento de productos"
          title="Productos más vendidos hoy"
          description="Los artículos con mayor salida durante la jornada, priorizados por unidades vendidas y aporte a ingresos."
          action={<InternalBadge tone="accent">Top productos</InternalBadge>}
        >
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full table-fixed border-separate border-spacing-0 text-sm">
              <colgroup>
                <col className="w-[50%]" />
                <col className="w-[18%]" />
                <col className="w-[32%]" />
              </colgroup>
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Producto</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Unidades</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-right font-semibold sm:px-6">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/70">
                {productosMasVendidos.map((producto) => (
                  <tr key={producto.id} className="transition-colors hover:bg-slate-800/70">
                    <td className="px-5 py-4 align-top sm:px-6">
                      <div className="space-y-1">
                        <div className="font-medium text-slate-50">{producto.nombre}</div>
                        <div className="text-xs text-slate-400">
                          {producto.codigo} · {producto.categoria}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top text-slate-300 sm:px-6">
                      <div className="font-medium text-slate-50">{producto.unidadesVendidas}</div>
                      <div className="text-xs text-slate-400">{producto.items} líneas de venta</div>
                    </td>
                    <td className="px-5 py-4 align-top text-right font-medium text-slate-50 sm:px-6">
                      {money(producto.ingresos)}
                    </td>
                  </tr>
                ))}

                {!productosMasVendidos.length && (
                  <tr>
                    <td className="px-5 py-8 text-slate-400 sm:px-6" colSpan={3}>
                      Todavía no hubo ventas de productos hoy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </InternalSection>

        <InternalSection
          eyebrow="Actividad reciente"
          title="Ventas de hoy"
          description="Últimos comprobantes emitidos durante la jornada, con cliente, horario y medio de pago."
          action={<InternalBadge>{resumen.ventasRecientes.length} registros</InternalBadge>}
        >
          <div className="overflow-x-auto">
            <table className="min-w-[780px] w-full table-fixed border-separate border-spacing-0 text-sm">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[28%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Comprobante</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Cliente</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Hora</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Pago</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-right font-semibold sm:px-6">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/70">
                {resumen.ventasRecientes.map((venta) => (
                  <tr key={venta.id} className="transition-colors hover:bg-slate-800/70">
                    <td className="px-5 py-4 align-top sm:px-6">
                      <div className="font-medium text-slate-50">#{venta.id}</div>
                      <div className="text-xs text-slate-400">{venta.itemsCount} ítems</div>
                    </td>
                    <td className="px-5 py-4 align-top text-slate-300 sm:px-6">
                      <div className="font-medium text-slate-50">{venta.cliente.nombre}</div>
                      <div className="text-xs text-slate-400">DNI {venta.cliente.dni}</div>
                    </td>
                    <td className="px-5 py-4 align-top text-slate-300 sm:px-6">{formatDateTime(venta.createdAt)}</td>
                    <td className="px-5 py-4 align-top sm:px-6">
                      <InternalBadge>{venta.metodoPago}</InternalBadge>
                    </td>
                    <td className="px-5 py-4 align-top text-right font-medium text-slate-50 sm:px-6">{money(venta.total)}</td>
                  </tr>
                ))}

                {!resumen.ventasRecientes.length && (
                  <tr>
                    <td className="px-5 py-8 text-slate-400 sm:px-6" colSpan={5}>
                      Todavía no hay ventas registradas hoy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </InternalSection>

        <InternalSection
          eyebrow="Control de inventario"
          title="Alerta de stock bajo"
          description="Productos en o por debajo de su mínimo para reponer antes de cortar ventas."
          action={
            <Link href="/productos" className={internalSecondaryButtonClassName}>
              Revisar inventario
            </Link>
          }
          tone="warning"
        >
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full table-fixed border-separate border-spacing-0 text-sm">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[20%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Producto</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Categoría</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Stock</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-left font-semibold sm:px-6">Mínimo</th>
                  <th className="border-b border-slate-800 px-5 py-3 text-right font-semibold sm:px-6">Faltan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/70">
                {productosBajoStock.map((producto) => {
                  const faltante = formatShortage(producto);

                  return (
                    <tr key={producto.id} className="transition-colors hover:bg-slate-800/70">
                      <td className="px-5 py-4 align-top sm:px-6">
                        <div className="space-y-1">
                          <div className="font-medium text-slate-50">{producto.nombre}</div>
                          <div className="text-xs text-slate-400">{producto.codigo}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top text-slate-300 sm:px-6">{producto.categoria}</td>
                      <td className="px-5 py-4 align-top sm:px-6">
                        <InternalBadge tone="warning">{producto.stock}</InternalBadge>
                      </td>
                      <td className="px-5 py-4 align-top text-slate-300 sm:px-6">{producto.stockMinimo}</td>
                      <td className="px-5 py-4 align-top text-right font-medium text-slate-50 sm:px-6">
                        {faltante > 0 ? faltante : "Reponer"}
                      </td>
                    </tr>
                  );
                })}

                {!productosBajoStock.length && (
                  <tr>
                    <td className="px-5 py-8 text-slate-400 sm:px-6" colSpan={5}>
                      No hay productos por debajo del stock mínimo.
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
