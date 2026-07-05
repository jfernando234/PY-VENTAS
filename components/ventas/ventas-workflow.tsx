"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  ClienteResumen,
  MetodoPago,
  ProductoResumen,
  TipoComprobante,
} from "@/lib/sales-types";
import {
  InternalBadge,
  InternalPageHeader,
  internalInputClassName,
  internalPrimaryButtonClassName,
  internalSecondaryButtonClassName,
  internalSoftSurfaceClassName,
  internalSurfaceClassName,
} from "@/components/internal/internal-ui";

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

export default function VentasWorkflow({ initialProducts, initialClients }: VentasWorkflowProps) {
  const router = useRouter();
  const [products] = useState(initialProducts);
  const [clients, setClients] = useState(initialClients);
  const [productSearch, setProductSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(initialClients[0]?.id ?? null);
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

    return products.filter((product) => [product.nombre, product.codigo, product.categoria].some((value) => value.toLowerCase().includes(q)));
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
  const discountValue = Math.min(Math.max(0, Number(discount || 0)), subtotal);
  const total = Math.max(0, subtotal - discountValue);
  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? null;

  function addProduct(product: ProductoResumen) {
    if (product.stock <= 0) return;

    setSaleError(null);
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);

      if (!existing) {
        return [...current, { productId: product.id, quantity: 1 }];
      }

      return current.map((line) =>
        line.productId === product.id ? { ...line, quantity: clampQuantity(line.quantity + 1, product.stock) } : line
      );
    });
  }

  function updateQuantity(productId: number, quantity: number) {
    const product = products.find((item) => item.id === productId);

    if (!product) return;

    setSaleError(null);
    setCart((current) => current.map((line) => (line.productId === productId ? { ...line, quantity: clampQuantity(quantity, product.stock) } : line)));
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
          items: cartLines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <InternalPageHeader
        eyebrow="Operación comercial"
        title="Nueva venta"
        description="Buscá productos, armá el carrito y registrá la operación en una sola pantalla."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)]">
        <section className="space-y-4">
          <div className={`${internalSurfaceClassName} p-4 lg:p-5`}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Catálogo</p>
                <h2 className="mt-2 text-base font-semibold text-slate-50">Productos</h2>
                <p className="text-sm leading-6 text-slate-300">Buscá por nombre, código o categoría.</p>
              </div>
              <div className="text-sm text-slate-400">{filteredProducts.length} resultados</div>
            </div>

            <input
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Buscar productos"
              className={`mt-4 ${internalInputClassName}`}
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <article key={product.id} className="rounded-[1.25rem] border border-slate-800 bg-slate-950/60 p-4 transition-colors hover:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-slate-50">{product.nombre}</h3>
                      <p className="text-xs text-slate-400">{product.codigo}</p>
                    </div>
                    <InternalBadge tone="accent">{product.categoria}</InternalBadge>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-50">{money(product.precio)}</span>
                    <span className={product.stock <= product.stockMinimo ? "text-amber-200" : "text-slate-400"}>
                      Stock {product.stock}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={product.stock <= 0}
                    onClick={() => addProduct(product)}
                    className={`${internalPrimaryButtonClassName} mt-4 w-full disabled:bg-slate-700 disabled:text-slate-400`}
                  >
                    {product.stock > 0 ? "Agregar" : "Sin stock"}
                  </button>
                </article>
              ))}

              {!filteredProducts.length && (
                <div className="rounded-[1.25rem] border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-400 sm:col-span-2 xl:col-span-3">
                  No hay productos que coincidan con la búsqueda.
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className={`${internalSurfaceClassName} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Cliente</p>
                <h2 className="mt-2 text-base font-semibold text-slate-50">Seleccionar o crear</h2>
                <p className="text-sm leading-6 text-slate-300">Elegí un cliente existente o crealo al instante.</p>
              </div>
              {selectedClient && <InternalBadge tone="success">Seleccionado</InternalBadge>}
            </div>

            <input
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
              placeholder="Buscar cliente"
              className={`mt-4 ${internalInputClassName}`}
            />

            <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedClientId(client.id)}
                  className={`w-full rounded-[1rem] border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                    client.id === selectedClientId
                      ? "border-emerald-500/30 bg-emerald-500/10 text-slate-50"
                      : "border-slate-800 bg-slate-950/60 text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{client.nombre}</div>
                      <div className="text-xs text-slate-400">DNI {client.dni}</div>
                    </div>
                    <span className="text-xs text-slate-500">#{client.id}</span>
                  </div>
                </button>
              ))}

              {!filteredClients.length && (
                <p className="rounded-[1rem] border border-dashed border-slate-700 bg-slate-950/40 px-3 py-4 text-sm text-slate-400">
                  No hay clientes con ese filtro.
                </p>
              )}
            </div>

            {selectedClient && (
              <div className={`${internalSoftSurfaceClassName} mt-3 p-3 text-sm text-slate-300`}>
                <div className="font-medium text-slate-50">{selectedClient.nombre}</div>
                <div>DNI {selectedClient.dni}</div>
                {selectedClient.email && <div>{selectedClient.email}</div>}
                {selectedClient.telefono && <div>{selectedClient.telefono}</div>}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="mt-4 space-y-3 rounded-[1rem] border border-slate-800 bg-slate-950/50 p-3">
              <div className="text-sm font-semibold text-slate-100">Crear cliente</div>
              <input
                value={clientForm.nombre}
                onChange={(event) => setClientForm((current) => ({ ...current, nombre: event.target.value }))}
                placeholder="Nombre y apellido"
                className={internalInputClassName}
              />
              <input
                value={clientForm.dni}
                onChange={(event) => setClientForm((current) => ({ ...current, dni: event.target.value }))}
                placeholder="DNI"
                className={internalInputClassName}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={clientForm.telefono}
                  onChange={(event) => setClientForm((current) => ({ ...current, telefono: event.target.value }))}
                  placeholder="Teléfono"
                  className={internalInputClassName}
                />
                <input
                  value={clientForm.email}
                  onChange={(event) => setClientForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Email"
                  type="email"
                  className={internalInputClassName}
                />
              </div>

              {clientError && <p className="text-sm text-rose-200">{clientError}</p>}

              <button type="submit" disabled={isCreatingClient} className={`${internalSecondaryButtonClassName} w-full`}>
                {isCreatingClient ? "Creando..." : "Crear y seleccionar"}
              </button>
            </form>
          </div>

          <form onSubmit={handleSubmit} className={`${internalSurfaceClassName} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Carrito</p>
                <h2 className="mt-2 text-base font-semibold text-slate-50">Resumen</h2>
                <p className="text-sm leading-6 text-slate-300">Editá cantidades y revisá el total.</p>
              </div>
              <InternalBadge>{cartLines.length} ítems</InternalBadge>
            </div>

            <div className="mt-4 space-y-3">
              {cartLines.map((line) => (
                <div key={line.productId} className="rounded-[1rem] border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-50">{line.product.nombre}</div>
                      <div className="text-xs text-slate-400">{money(line.product.precio)} c/u</div>
                    </div>
                    <button type="button" onClick={() => removeProduct(line.productId)} className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-100">
                      Quitar
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                        className={`${internalSecondaryButtonClassName} h-9 w-9 px-0 py-0`}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={line.product.stock}
                        value={line.quantity}
                        onChange={(event) => updateQuantity(line.productId, Number(event.target.value))}
                        className={`${internalInputClassName} w-20 text-center`}
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                        className={`${internalSecondaryButtonClassName} h-9 w-9 px-0 py-0`}
                      >
                        +
                      </button>
                    </div>
                    <div className="text-sm font-semibold text-slate-50">{money(line.lineTotal)}</div>
                  </div>
                </div>
              ))}

              {!cartLines.length && (
                <div className="rounded-[1rem] border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-400">
                  Aún no agregaste productos.
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="block font-medium text-slate-200">Descuento</span>
                <input type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} className={internalInputClassName} />
              </label>

              <label className="space-y-1 text-sm">
                <span className="block font-medium text-slate-200">Método de pago</span>
                <select value={metodoPago} onChange={(event) => setMetodoPago(event.target.value as MetodoPago)} className={internalInputClassName}>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
              </label>

              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="block font-medium text-slate-200">Comprobante</span>
                <select value={comprobante} onChange={(event) => setComprobante(event.target.value as TipoComprobante)} className={internalInputClassName}>
                  <option value="BOLETA">Boleta</option>
                  <option value="FACTURA">Factura</option>
                </select>
              </label>
            </div>

            <div className={`${internalSoftSurfaceClassName} mt-4 space-y-2 p-3 text-sm text-slate-300`}>
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Descuento</span>
                <span>-{money(discountValue)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-base font-semibold text-slate-50">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
            </div>

            {saleError && <p className="mt-3 text-sm text-rose-200">{saleError}</p>}
            <button type="submit" disabled={isSaving || !selectedClientId || !cartLines.length} className={`${internalPrimaryButtonClassName} mt-4 w-full`}>
              {isSaving ? "Guardando..." : "Guardar venta"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
