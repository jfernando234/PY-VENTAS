import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerVenta } from "@/lib/sales";
import VentaPrintButton from "@/components/ventas/venta-print-button";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function VentaDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const venta = await obtenerVenta(Number(id));

  if (!venta) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl space-y-4 print:max-w-none print:space-y-0">
        <div className="flex items-start justify-between gap-3 flex-wrap print:hidden">
          <div>
            <p className="text-sm text-gray-500">Venta #{venta.id}</p>
            <h1 className="text-2xl font-semibold text-gray-900">Comprobante listo para imprimir</h1>
            <p className="mt-1 text-sm text-gray-600">
              {new Intl.DateTimeFormat("es-AR", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(venta.createdAt))}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <VentaPrintButton />
            <Link
              href="/ventas"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Nueva venta
            </Link>
          </div>
        </div>

        <main className="rounded-2xl border border-gray-200 bg-white p-6 print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">Comprobante</p>
              <h2 className="text-2xl font-semibold text-gray-900">{venta.comprobante}</h2>
              <p className="mt-1 text-sm text-gray-600">Venta #{venta.id}</p>
            </div>

            <div className="text-right text-sm text-gray-600">
              <div className="font-medium text-gray-900">{new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(venta.createdAt))}</div>
              <div>{venta.usuario.nombre}</div>
            </div>
          </div>

          <section className="grid gap-3 border-b border-gray-200 py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Cliente</p>
              <p className="mt-1 font-medium text-gray-900">{venta.cliente.nombre}</p>
              <p className="text-gray-600">DNI {venta.cliente.dni}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Pago</p>
              <p className="mt-1 font-medium text-gray-900">{venta.metodoPago}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Atendido por</p>
              <p className="mt-1 font-medium text-gray-900">{venta.usuario.nombre}</p>
              <p className="text-gray-600">{venta.usuario.email}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{money(venta.total)}</p>
              <p className="text-gray-600">Descuento {money(venta.descuento)}</p>
            </div>
          </section>

          <section className="py-4">
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div className="grid grid-cols-[minmax(0,1fr)_5rem_7rem_7rem] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <div>Producto</div>
                <div className="text-right">Cant.</div>
                <div className="text-right">Unit.</div>
                <div className="text-right">Subtotal</div>
              </div>

              <div className="divide-y divide-gray-200">
                {venta.detalles.map((detalle) => (
                  <div
                    key={detalle.id}
                    className="grid grid-cols-[minmax(0,1fr)_5rem_7rem_7rem] gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{detalle.producto.nombre}</p>
                      <p className="text-gray-500">{detalle.producto.codigo}</p>
                    </div>
                    <div className="text-right text-gray-700">{detalle.cantidad}</div>
                    <div className="text-right text-gray-700">{money(detalle.precioUnit)}</div>
                    <div className="text-right font-medium text-gray-900">{money(detalle.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex justify-end border-t border-gray-200 pt-4">
            <div className="w-full max-w-sm rounded-xl bg-gray-50 p-4 text-sm text-gray-700 print:border print:border-gray-200 print:bg-white">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{money(venta.detalles.reduce((sum, item) => sum + item.subtotal, 0))}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Descuento</span>
                <span>-{money(venta.descuento)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>{money(venta.total)}</span>
              </div>
            </div>
          </section>

          <p className="mt-6 text-center text-xs text-gray-500 print:mt-4">
            Documento interno generado por el sistema de ventas.
          </p>
        </main>
      </div>
    </div>
  );
}
