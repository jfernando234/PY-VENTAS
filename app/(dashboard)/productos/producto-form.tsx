"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  internalInputClassName,
  internalPrimaryButtonClassName,
  internalSurfaceClassName,
} from "@/components/internal/internal-ui";

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
    <section id="nuevo-producto" className={`${internalSurfaceClassName} p-5 lg:p-6`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Inventario</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-50">Nuevo producto</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">Cargá el producto para dejarlo listo para ventas.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="nombre" className="block text-sm font-medium text-slate-200">
            Nombre
          </label>
          <input
            id="nombre"
            type="text"
            required
            value={form.nombre}
            onChange={(event) => updateField("nombre", event.target.value)}
            disabled={isLoading}
            className={internalInputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="codigo" className="block text-sm font-medium text-slate-200">
            Código
          </label>
          <input
            id="codigo"
            type="text"
            required
            value={form.codigo}
            onChange={(event) => updateField("codigo", event.target.value)}
            disabled={isLoading}
            className={internalInputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="categoria" className="block text-sm font-medium text-slate-200">
            Categoría
          </label>
          <input
            id="categoria"
            type="text"
            required
            value={form.categoria}
            onChange={(event) => updateField("categoria", event.target.value)}
            disabled={isLoading}
            className={internalInputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="precio" className="block text-sm font-medium text-slate-200">
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
            className={internalInputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="stock" className="block text-sm font-medium text-slate-200">
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
            className={internalInputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="stockMinimo" className="block text-sm font-medium text-slate-200">
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
            className={internalInputClassName}
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-3">
          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-100">
              {success}
            </div>
          )}

          <button type="submit" disabled={isLoading} className={internalPrimaryButtonClassName}>
            {isLoading ? "Guardando..." : "Guardar producto"}
          </button>
        </div>
      </form>
    </section>
  );
}
