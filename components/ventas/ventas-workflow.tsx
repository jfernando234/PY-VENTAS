"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  ClienteResumen,
  MetodoPago,
  ProductoResumen,
  TipoComprobante,
} from "@/lib/sales-types";

interface VentasWorkflowProps {
  initialProducts: ProductoResumen[];
  initialClients: ClienteResumen[];
}

interface CartLine {
  productId: number;
  quantity: number;
}

interface CartLineView extends CartLine {
  product: ProductoResumen;
  lineTotal: number;
}

function money(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

function clampQuantity(value: number, stock: number) {
  return Math.min(Math.max(1, value), Math.max(1, stock));
}

export default function VentasWorkflow({
  initialProducts,
  initialClients,
}: VentasWorkflowProps) {
  const router = useRouter();
  const [products] = useState(initialProducts);
  const [clients, setClients] = useState(initialClients);
  const [productSearch, setProductSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(
    initialClients[0]?.id ?? null
  );
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState("0");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO");
  const [comprobante, setComprobante] = useState<TipoComprobante>("BOLETA");
  const [isSaving, setIsSaving] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [clientForm, setClientForm] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    email: "",
  });

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();

    if (!q) {
      return products;
    }

    return products.filter((product) =>
      [product.nombre, product.codigo, product.categoria].some((value) =>
        value.toLowerCase().includes(q)
      )
    );
  }, [productSearch, products]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();

    if (!q) {
      return clients;
    }

    return clients.filter((client) =>
      [client.nombre, client.dni, client.telefono ?? "", client.email ?? ""].some((value) =>
        value.toLowerCase().includes(q)
      )
    );
  }, [clientSearch, clients]);

  const cartLines = useMemo(
    () =>
      cart
        .map((line) => {
          const product = products.find((item) => item.id === line.productId);

          if (!product) {
            return null;
          }

          const quantity = clampQuantity(line.quantity, product.stock);
          const lineTotal = product.precio * quantity;

          return {
            ...line,
            quantity,
            product,
            lineTotal,
          } satisfies CartLineView;
        })
        .filter((line): line is CartLineView => line !== null),
    [cart, products]
  );

  const subtotal = cartLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const discountValue = Math.min(
    Math.max(0, Number(discount || 0)),
    subtotal
  );
  const total = Math.max(0, subtotal - discountValue);
  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? null;

  function addProduct(product: ProductoResumen) {
    if (product.stock <= 0) {
      return;
    }

    setSaleError(null);
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);

      if (!existing) {
        return [...current, { productId: product.id, quantity: 1 }];
      }

      return current.map((line) =>
        line.productId === product.id
          ? { ...line, quantity: clampQuantity(line.quantity + 1, product.stock) }
          : line
      );
    });
  }

  function updateQuantity(productId: number, quantity: number) {
    const product = products.find((item) => item.id === productId);

    if (!product) {
      return;
    }

    setSaleError(null);
    setCart((current) =>
      current.map((line) =>
        line.productId === productId
          ? { ...line, quantity: clampQuantity(quantity, product.stock) }
          : line
      )
    );
  }

  function removeProduct(productId: number) {
    setSaleError(null);
    setCart((current) => current.filter((line) => line.productId !== productId));
  }

  async function handleCreateClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError(null);

    if (!clientForm.nombre.trim() || !clientForm.dni.trim()) {
      setClientError("Completá nombre y DNI para crear el cliente.");
      return;
    }

    setIsCreatingClient(true);

    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientForm),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo crear el cliente.");
      }

      setClients((current) => [payload.cliente, ...current]);
      setSelectedClientId(payload.cliente.id);
      setClientForm({ nombre: "", dni: "", telefono: "", email: "" });
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "No se pudo crear el cliente.");
    } finally {
      setIsCreatingClient(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaleError(null);

    if (!selectedClientId) {
      setSaleError("Seleccioná o creá un cliente antes de guardar.");
      return;
    }

    if (!cartLines.length) {
      setSaleError("Agregá al menos un producto a la venta.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: selectedClientId,
          items: cartLines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
          discount: discountValue,
          metodoPago,
          comprobante,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo registrar la venta.");
      }

      setIsSaving(false);
      router.replace(`/ventas/${payload.venta.id}`);
    } catch (error) {
      setSaleError(error instanceof Error ? error.message : "No se pudo registrar la venta.");
      setIsSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Nueva venta</h1>
        <p className="text-sm text-gray-600 mt-1">
          Buscá productos, armá el carrito y registrá la operación en una sola pantalla.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Productos</h2>
                <p className="text-sm text-gray-500">Buscá por nombre, código o categoría.</p>
              </div>
              <div className="text-sm text-gray-500">{filteredProducts.length} resultados</div>
            </div>

            <input
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Buscar productos"
              className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <article key={product.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{product.nombre}</h3>
                      <p className="text-xs text-gray-500">{product.codigo}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {product.categoria}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{money(product.precio)}</span>
                    <span className={product.stock <= product.stockMinimo ? "text-amber-700" : "text-gray-500"}>
                      Stock {product.stock}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={product.stock <= 0}
                    onClick={() => addProduct(product)}
                    className="mt-4 w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {product.stock > 0 ? "Agregar" : "Sin stock"}
                  </button>
                </article>
              ))}

              {!filteredProducts.length && (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 sm:col-span-2 xl:col-span-3">
                  No hay productos que coincidan con la búsqueda.
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Cliente</h2>
                <p className="text-sm text-gray-500">Seleccioná uno existente o crealo al instante.</p>
              </div>
              {selectedClient && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Seleccionado
                </span>
              )}
            </div>

            <input
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
              placeholder="Buscar cliente"
              className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
            />

            <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedClientId(client.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    client.id === selectedClientId
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-gray-900">{client.nombre}</div>
                      <div className="text-xs text-gray-500">DNI {client.dni}</div>
                    </div>
                    <span className="text-xs text-gray-500">#{client.id}</span>
                  </div>
                </button>
              ))}

              {!filteredClients.length && (
                <p className="rounded-xl border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500">
                  No hay clientes con ese filtro.
                </p>
              )}
            </div>

            {selectedClient && (
              <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                <div className="font-medium text-gray-900">{selectedClient.nombre}</div>
                <div>DNI {selectedClient.dni}</div>
                {selectedClient.email && <div>{selectedClient.email}</div>}
                {selectedClient.telefono && <div>{selectedClient.telefono}</div>}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="mt-4 space-y-3 rounded-xl border border-gray-200 p-3">
              <div className="text-sm font-medium text-gray-900">Crear cliente</div>
              <input
                value={clientForm.nombre}
                onChange={(event) => setClientForm((current) => ({ ...current, nombre: event.target.value }))}
                placeholder="Nombre y apellido"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
              <input
                value={clientForm.dni}
                onChange={(event) => setClientForm((current) => ({ ...current, dni: event.target.value }))}
                placeholder="DNI"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={clientForm.telefono}
                  onChange={(event) => setClientForm((current) => ({ ...current, telefono: event.target.value }))}
                  placeholder="Teléfono"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
                <input
                  value={clientForm.email}
                  onChange={(event) => setClientForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Email"
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>

              {clientError && <p className="text-sm text-red-600">{clientError}</p>}

              <button
                type="submit"
                disabled={isCreatingClient}
                className="w-full rounded-lg border border-gray-900 px-3 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-900 hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
              >
                {isCreatingClient ? "Creando..." : "Crear y seleccionar"}
              </button>
            </form>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Carrito</h2>
                <p className="text-sm text-gray-500">Editá cantidades y revisá el total.</p>
              </div>
              <span className="text-sm text-gray-500">{cartLines.length} ítems</span>
            </div>

            <div className="mt-4 space-y-3">
              {cartLines.map((line) => (
                <div key={line.productId} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900">{line.product.nombre}</div>
                      <div className="text-xs text-gray-500">{money(line.product.precio)} c/u</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(line.productId)}
                      className="text-xs font-medium text-gray-500 hover:text-gray-900"
                    >
                      Quitar
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                        className="h-9 w-9 rounded-lg border border-gray-300 text-lg leading-none text-gray-700 hover:bg-gray-50"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={line.product.stock}
                        value={line.quantity}
                        onChange={(event) => updateQuantity(line.productId, Number(event.target.value))}
                        className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-center text-sm outline-none focus:border-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                        className="h-9 w-9 rounded-lg border border-gray-300 text-lg leading-none text-gray-700 hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{money(line.lineTotal)}</div>
                  </div>
                </div>
              ))}

              {!cartLines.length && (
                <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                  Aún no agregaste productos.
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="block font-medium text-gray-700">Descuento</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="block font-medium text-gray-700">Método de pago</span>
                <select
                  value={metodoPago}
                  onChange={(event) => setMetodoPago(event.target.value as MetodoPago)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
              </label>

              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="block font-medium text-gray-700">Comprobante</span>
                <select
                  value={comprobante}
                  onChange={(event) => setComprobante(event.target.value as TipoComprobante)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900"
                >
                  <option value="BOLETA">Boleta</option>
                  <option value="FACTURA">Factura</option>
                </select>
              </label>
            </div>

            <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Descuento</span>
                <span>-{money(discountValue)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
            </div>

            {saleError && <p className="mt-3 text-sm text-red-600">{saleError}</p>}
            <button
              type="submit"
              disabled={isSaving || !selectedClientId || !cartLines.length}
              className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSaving ? "Guardando..." : "Guardar venta"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
