import { listarProductos } from "@/lib/sales";
import { ProductoForm } from "./producto-form";
import {
  InternalBadge,
  InternalEmptyState,
  InternalPageHeader,
  InternalPageShell,
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

export default async function ProductosPage() {
  const productos = await listarProductos();

  return (
    <InternalPageShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <InternalPageHeader
          eyebrow="Inventario"
          title="Productos"
          description="Listado de inventario disponible con foco en stock, categoría y precio."
          actions={
            <a href="#nuevo-producto" className={internalPrimaryButtonClassName}>
              Cargar producto
            </a>
          }
        />

        <ProductoForm />

        <InternalSection
          eyebrow="Catálogo"
          title="Inventario operativo"
          description="Vista compacta de los productos disponibles para venta."
          action={<InternalBadge tone="accent">{productos.length} productos</InternalBadge>}
        >
          <div className="overflow-hidden rounded-b-[1.75rem]">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950/70 text-slate-400">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold sm:px-6">Producto</th>
                  <th className="px-5 py-3 text-left font-semibold sm:px-6">Categoría</th>
                  <th className="px-5 py-3 text-left font-semibold sm:px-6">Precio</th>
                  <th className="px-5 py-3 text-left font-semibold sm:px-6">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/70">
                {productos.map((producto) => (
                  <tr key={producto.id} className="transition-colors hover:bg-slate-800/70">
                    <td className="px-5 py-4 sm:px-6">
                      <div className="font-medium text-slate-50">{producto.nombre}</div>
                      <div className="text-xs text-slate-400">{producto.codigo}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-300 sm:px-6">{producto.categoria}</td>
                    <td className="px-5 py-4 text-slate-300 sm:px-6">{money(producto.precio)}</td>
                    <td className="px-5 py-4 text-slate-300 sm:px-6">
                      <span className={producto.stock <= producto.stockMinimo ? "font-semibold text-amber-200" : "text-slate-200"}>
                        {producto.stock}
                      </span>
                    </td>
                  </tr>
                ))}

                {!productos.length && (
                  <tr>
                    <td className="px-5 py-6 sm:px-6" colSpan={4}>
                      <InternalEmptyState
                        title="No hay productos cargados."
                        description="La primera carga de inventario aparecerá acá."
                        action={
                          <a href="#nuevo-producto" className={internalPrimaryButtonClassName}>
                            Crear producto
                          </a>
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
