"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  nombre: string;
  codigo: string;
  categoria: string;
  precio: string;
  stock: string;
  stockMinimo: string;
};

const initialState: FormState = {
  nombre: "",
  codigo: "",
  categoria: "",
  precio: "",
  stock: "",
  stockMinimo: "",
};

export function ProductoForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const nombre = form.nombre.trim();
    const codigo = form.codigo.trim();
    const categoria = form.categoria.trim();
    const precio = Number(form.precio);
    const stock = Number(form.stock);
    const stockMinimo = form.stockMinimo.trim() ? Number(form.stockMinimo) : undefined;

    if (!nombre || !codigo || !categoria) {
      setError("Completá nombre, código y categoría.");
      return;
    }

    if (!Number.isFinite(precio) || precio < 0 || !Number.isFinite(stock) || stock < 0) {
      setError("Precio y stock deben ser valores válidos.");
      return;
    }

    if (stockMinimo !== undefined && (!Number.isFinite(stockMinimo) || stockMinimo < 0)) {
      setError("El stock mínimo debe ser un valor válido.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          codigo,
          categoria,
          precio,
          stock: Math.floor(stock),
          stockMinimo: stockMinimo === undefined ? undefined : Math.floor(stockMinimo),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { producto?: { nombre: string }; error?: string }
        | null;

      if (!response.ok) {
        setError(payload?.error ?? "No se pudo crear el producto.");
        return;
      }

      setSuccess(`Producto ${payload?.producto?.nombre ?? nombre} creado con éxito.`);
      setForm(initialState);
      router.refresh();
    } catch {
      setError("Ocurrió un error. Intentá nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section id="nuevo-producto" className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Nuevo producto</h2>
        <p className="mt-1 text-sm text-gray-600">Cargá el producto para dejarlo listo para ventas.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <input
            id="nombre"
            type="text"
            required
            value={form.nombre}
            onChange={(event) => updateField("nombre", event.target.value)}
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">
            Código
          </label>
          <input
            id="codigo"
            type="text"
            required
            value={form.codigo}
            onChange={(event) => updateField("codigo", event.target.value)}
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">
            Categoría
          </label>
          <input
            id="categoria"
            type="text"
            required
            value={form.categoria}
            onChange={(event) => updateField("categoria", event.target.value)}
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="precio" className="block text-sm font-medium text-gray-700">
            Precio
          </label>
          <input
            id="precio"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.precio}
            onChange={(event) => updateField("precio", event.target.value)}
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
            Stock inicial
          </label>
          <input
            id="stock"
            type="number"
            min="0"
            step="1"
            required
            value={form.stock}
            onChange={(event) => updateField("stock", event.target.value)}
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="stockMinimo" className="block text-sm font-medium text-gray-700">
            Stock mínimo
          </label>
          <input
            id="stockMinimo"
            type="number"
            min="0"
            step="1"
            value={form.stockMinimo}
            onChange={(event) => updateField("stockMinimo", event.target.value)}
            disabled={isLoading}
            placeholder="5"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-3">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Guardando..." : "Guardar producto"}
          </button>
        </div>
      </form>
    </section>
  );
}
