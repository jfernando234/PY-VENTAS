import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerVenta } from "@/lib/sales";
import VentaPrintButton from "@/components/ventas/venta-print-button";
import {
  internalSecondaryButtonClassName,
  internalSurfaceClassName,
} from "@/components/internal/internal-ui";

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

  const subtotal = venta.detalles.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="min-h-full bg-slate-950 px-4 py-6 text-slate-100 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 print:max-w-none print:gap-0">
        <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
          <div>
            <p className="text-sm text-slate-400">Venta #{venta.id}</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Comprobante listo para imprimir</h1>
            <p className="mt-1 text-sm text-slate-400">
              {new Intl.DateTimeFormat("es-AR", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(venta.createdAt))}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <VentaPrintButton />
            <Link href="/ventas/nueva" className={internalSecondaryButtonClassName}>
              Nueva venta
            </Link>
          </div>
        </div>

        <main className={`${internalSurfaceClassName} p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none`}>
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 print:border-slate-300">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-slate-400 print:text-slate-500">Comprobante</p>
              <h2 className="text-2xl font-semibold text-slate-50 print:text-slate-900">{venta.comprobante}</h2>
              <p className="mt-1 text-sm text-slate-400 print:text-slate-600">Venta #{venta.id}</p>
            </div>

            <div className="text-right text-sm text-slate-400 print:text-slate-600">
              <div className="font-medium text-slate-100 print:text-slate-900">
                {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(venta.createdAt))}
              </div>
              <div>{venta.usuario.nombre}</div>
            </div>
          </div>

          <section className="grid gap-3 border-b border-slate-800 py-4 text-sm sm:grid-cols-2 lg:grid-cols-4 print:border-slate-300">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400 print:text-slate-500">Cliente</p>
              <p className="mt-1 font-medium text-slate-50 print:text-slate-900">{venta.cliente.nombre}</p>
              <p className="text-slate-400 print:text-slate-600">DNI {venta.cliente.dni}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400 print:text-slate-500">Pago</p>
              <p className="mt-1 font-medium text-slate-50 print:text-slate-900">{venta.metodoPago}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400 print:text-slate-500">Atendido por</p>
              <p className="mt-1 font-medium text-slate-50 print:text-slate-900">{venta.usuario.nombre}</p>
              <p className="text-slate-400 print:text-slate-600">{venta.usuario.email}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400 print:text-slate-500">Total</p>
              <p className="mt-1 text-xl font-semibold text-slate-50 print:text-slate-900">{money(venta.total)}</p>
              <p className="text-slate-400 print:text-slate-600">Descuento {money(venta.descuento)}</p>
            </div>
          </section>

          <section className="py-4">
            <div className="overflow-hidden rounded-[1.25rem] border border-slate-800 print:rounded-none print:border-slate-300">
              <div className="grid grid-cols-[minmax(0,1fr)_5rem_7rem_7rem] gap-3 border-b border-slate-800 bg-slate-950/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 print:border-slate-300 print:bg-slate-100 print:text-slate-500">
                <div>Producto</div>
                <div className="text-right">Cant.</div>
                <div className="text-right">Unit.</div>
                <div className="text-right">Subtotal</div>
              </div>

              <div className="divide-y divide-slate-800 print:divide-slate-300">
                {venta.detalles.map((detalle) => (
                  <div key={detalle.id} className="grid grid-cols-[minmax(0,1fr)_5rem_7rem_7rem] gap-3 px-4 py-3 text-sm print:text-slate-900">
                    <div>
                      <p className="font-medium text-slate-50 print:text-slate-900">{detalle.producto.nombre}</p>
                      <p className="text-slate-400 print:text-slate-600">{detalle.producto.codigo}</p>
                    </div>
                    <div className="text-right text-slate-300 print:text-slate-700">{detalle.cantidad}</div>
                    <div className="text-right text-slate-300 print:text-slate-700">{money(detalle.precioUnit)}</div>
                    <div className="text-right font-medium text-slate-50 print:text-slate-900">{money(detalle.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex justify-end border-t border-slate-800 pt-4 print:border-slate-300">
            <div className="w-full max-w-sm rounded-[1.25rem] bg-slate-950/60 p-4 text-sm text-slate-300 print:border print:border-slate-300 print:bg-white print:text-slate-700">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Descuento</span>
                <span>-{money(venta.descuento)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3 text-base font-semibold text-slate-50 print:border-slate-300 print:text-slate-900">
                <span>Total</span>
                <span>{money(venta.total)}</span>
              </div>
            </div>
          </section>

          <p className="mt-6 text-center text-xs text-slate-500 print:mt-4 print:text-slate-500">
            Documento interno generado por el sistema de ventas.
          </p>
        </main>
      </div>
    </div>
  );
}
