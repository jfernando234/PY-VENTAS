import { listarProductos } from "@/lib/sales";
import { ProductoForm } from "./producto-form";

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
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Productos</h1>
          <p className="mt-1 text-sm text-gray-600">Listado básico de inventario disponible.</p>
        </div>

        <a
          href="#nuevo-producto"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cargar producto
        </a>
      </div>

      <ProductoForm />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Producto</th>
              <th className="px-4 py-3 text-left font-medium">Categoría</th>
              <th className="px-4 py-3 text-left font-medium">Precio</th>
              <th className="px-4 py-3 text-left font-medium">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{producto.nombre}</div>
                  <div className="text-xs text-gray-500">{producto.codigo}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">{producto.categoria}</td>
                <td className="px-4 py-3 text-gray-700">{money(producto.precio)}</td>
                <td className="px-4 py-3 text-gray-700">
                  <span className={producto.stock <= producto.stockMinimo ? "text-amber-700 font-medium" : ""}>
                    {producto.stock}
                  </span>
                </td>
              </tr>
            ))}
            {!productos.length && (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={4}>
                  No hay productos cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
