import { listarClientes, listarProductos } from "@/lib/sales";
import VentasWorkflow from "@/components/ventas/ventas-workflow";

export const dynamic = "force-dynamic";

export default async function NuevaVentaPage() {
  const [initialProducts, initialClients] = await Promise.all([
    listarProductos(),
    listarClientes(),
  ]);

  return <VentasWorkflow initialProducts={initialProducts} initialClients={initialClients} />;
}
