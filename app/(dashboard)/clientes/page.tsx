import { listarClientes } from "@/lib/sales";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clientes = await listarClientes();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
        <p className="text-sm text-gray-600 mt-1">Listado básico de clientes para el proceso de ventas.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Cliente</th>
              <th className="px-4 py-3 text-left font-medium">DNI</th>
              <th className="px-4 py-3 text-left font-medium">Contacto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{cliente.nombre}</td>
                <td className="px-4 py-3 text-gray-700">{cliente.dni}</td>
                <td className="px-4 py-3 text-gray-700">
                  <div>{cliente.telefono ?? "-"}</div>
                  <div className="text-xs text-gray-500">{cliente.email ?? ""}</div>
                </td>
              </tr>
            ))}
            {!clientes.length && (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={3}>
                  No hay clientes cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
