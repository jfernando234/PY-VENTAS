import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ClienteResumen,
  CrearVentaInput,
  ItemVentaInput,
  MetodoPago,
  ProductoResumen,
  TipoComprobante,
  VentaVista,
  VentaResumen,
} from "@/lib/sales-types";

export class SalesError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SalesError";
    this.status = status;
  }
}

export class ValidationError extends SalesError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends SalesError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends SalesError {
  constructor(message: string) {
    super(message, 409);
  }
}

export type ResumenVentasHoy = {
  fecha: string;
  ventasCount: number;
  totalNeto: number;
  promedioTicket: number;
  itemsVendidos: number;
  descuentos: number;
  ventasRecientes: Array<{
    id: number;
    total: number;
    descuento: number;
    metodoPago: MetodoPago;
    createdAt: string;
    cliente: ClienteResumen;
    itemsCount: number;
  }>;
};

export type ProductoMasVendidoHoy = {
  id: number;
  nombre: string;
  codigo: string;
  categoria: string;
  unidadesVendidas: number;
  ingresos: number;
  items: number;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getDayRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function mapProducto(producto: {
  id: number;
  nombre: string;
  codigo: string;
  categoria: string;
  precio: number;
  stock: number;
  stockMinimo: number;
}): ProductoResumen {
  return {
    id: producto.id,
    nombre: producto.nombre,
    codigo: producto.codigo,
    categoria: producto.categoria,
    precio: producto.precio,
    stock: producto.stock,
    stockMinimo: producto.stockMinimo,
  };
}

function mapCliente(cliente: {
  id: number;
  nombre: string;
  dni: string;
  telefono: string | null;
  email: string | null;
}): ClienteResumen {
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    dni: cliente.dni,
    telefono: cliente.telefono,
    email: cliente.email,
  };
}

function toSearch(text: string | null | undefined) {
  return text?.trim() ?? "";
}

function normalizeText(value: unknown, field: string) {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} is required.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new ValidationError(`${field} is required.`);
  }

  return normalized;
}

function normalizeNumber(value: unknown, field: string, min = 0) {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue) || numberValue < min) {
    throw new ValidationError(`${field} is invalid.`);
  }

  return numberValue;
}

function normalizeInteger(value: unknown, field: string, min = 0) {
  const numberValue = normalizeNumber(value, field, min);

  return Math.floor(numberValue);
}

function normalizeOptionalInteger(value: unknown, field: string, fallback: number) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return normalizeInteger(value, field, 0);
}

function isMetodoPago(value: unknown): value is MetodoPago {
  return value === "EFECTIVO" || value === "TARJETA" || value === "TRANSFERENCIA";
}

function isTipoComprobante(value: unknown): value is TipoComprobante {
  return value === "BOLETA" || value === "FACTURA";
}

function normalizeItems(items: ItemVentaInput[]) {
  if (!Array.isArray(items)) {
    throw new ValidationError("items is required.");
  }

  const grouped = new Map<number, number>();

  for (const item of items) {
    const productId = normalizeNumber(item.productId, "productId", 1);
    const quantity = normalizeNumber(item.quantity, "quantity", 1);
    grouped.set(productId, (grouped.get(productId) ?? 0) + Math.floor(quantity));
  }

  return Array.from(grouped.entries(), ([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export async function listarProductos(query = "") {
  const search = toSearch(query);

  const where = search
    ? {
        OR: [
          { nombre: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { codigo: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { categoria: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : undefined;

  const productos = await prisma.producto.findMany({
    where,
    orderBy: [{ nombre: "asc" }],
  });

  return productos.map(mapProducto);
}

export async function listarProductosBajoStock(limit = 5) {
  const productos = await listarProductos();

  return productos
    .filter((producto) => producto.stock <= producto.stockMinimo)
    .sort((a, b) => {
      const faltanteA = a.stockMinimo - a.stock;
      const faltanteB = b.stockMinimo - b.stock;

      return faltanteB - faltanteA || a.stock - b.stock || a.nombre.localeCompare(b.nombre);
    })
    .slice(0, limit);
}

export async function crearProducto(data: {
  nombre: unknown;
  codigo: unknown;
  categoria: unknown;
  precio: unknown;
  stock: unknown;
  stockMinimo?: unknown;
}) {
  const nombre = normalizeText(data.nombre, "nombre");
  const codigo = normalizeText(data.codigo, "codigo");
  const categoria = normalizeText(data.categoria, "categoria");
  const precio = normalizeNumber(data.precio, "precio", 0);
  const stock = normalizeInteger(data.stock, "stock", 0);
  const stockMinimo = normalizeOptionalInteger(data.stockMinimo, "stockMinimo", 5);

  try {
    const producto = await prisma.producto.create({
      data: {
        nombre,
        codigo,
        categoria,
        precio,
        stock,
        stockMinimo,
      },
    });

    return mapProducto(producto);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError("El código ya está registrado.");
    }

    throw error;
  }
}

export async function listarClientes(query = "") {
  const search = toSearch(query);

  const where = search
    ? {
        OR: [
          { nombre: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { dni: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { telefono: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : undefined;

  const clientes = await prisma.cliente.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { nombre: "asc" }],
  });

  return clientes.map(mapCliente);
}

export async function obtenerVenta(id: number): Promise<VentaVista | null> {
  const venta = await prisma.venta.findUnique({
    where: { id },
    include: {
      cliente: true,
      usuario: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
      detalles: {
        orderBy: { id: "asc" },
        include: {
          producto: true,
        },
      },
    },
  });

  if (!venta) {
    return null;
  }

  return {
    id: venta.id,
    total: venta.total,
    descuento: venta.descuento,
    metodoPago: venta.metodoPago,
    comprobante: venta.comprobante,
    createdAt: venta.createdAt.toISOString(),
    cliente: mapCliente(venta.cliente),
    usuario: venta.usuario,
    detalles: venta.detalles.map((detalle) => ({
      id: detalle.id,
      cantidad: detalle.cantidad,
      precioUnit: detalle.precioUnit,
      subtotal: detalle.subtotal,
      producto: mapProducto(detalle.producto),
    })),
  };
}

export async function listarVentas(limit = 20): Promise<VentaResumen[]> {
  const ventas = await prisma.venta.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      cliente: true,
      usuario: {
        select: {
          id: true,
          nombre: true,
        },
      },
      _count: {
        select: {
          detalles: true,
        },
      },
    },
  });

  return ventas.map((venta) => ({
    id: venta.id,
    total: venta.total,
    descuento: venta.descuento,
    subtotal: roundMoney(venta.total + venta.descuento),
    metodoPago: venta.metodoPago,
    comprobante: venta.comprobante,
    createdAt: venta.createdAt.toISOString(),
    cliente: mapCliente(venta.cliente),
    usuario: venta.usuario,
    itemsCount: venta._count.detalles,
  }));
}

export async function obtenerResumenVentasHoy(fecha = new Date()): Promise<ResumenVentasHoy> {
  const { start, end } = getDayRange(fecha);

  const ventas = await prisma.venta.findMany({
    where: {
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      total: true,
      descuento: true,
      metodoPago: true,
      createdAt: true,
      cliente: {
        select: {
          id: true,
          nombre: true,
          dni: true,
          telefono: true,
          email: true,
        },
      },
      detalles: {
        select: {
          cantidad: true,
        },
      },
    },
  });

  const ventasCount = ventas.length;
  const totalNeto = roundMoney(ventas.reduce((sum, venta) => sum + venta.total, 0));
  const descuentos = roundMoney(ventas.reduce((sum, venta) => sum + venta.descuento, 0));
  const itemsVendidos = ventas.reduce(
    (sum, venta) => sum + venta.detalles.reduce((detailSum, detalle) => detailSum + detalle.cantidad, 0),
    0
  );

  return {
    fecha: start.toISOString(),
    ventasCount,
    totalNeto,
    promedioTicket: ventasCount ? roundMoney(totalNeto / ventasCount) : 0,
    itemsVendidos,
    descuentos,
    ventasRecientes: ventas.slice(0, 5).map((venta) => ({
      id: venta.id,
      total: venta.total,
      descuento: venta.descuento,
      metodoPago: venta.metodoPago,
      createdAt: venta.createdAt.toISOString(),
      cliente: mapCliente(venta.cliente),
      itemsCount: venta.detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0),
    })),
  };
}

export async function obtenerProductosMasVendidosHoy(
  fecha = new Date(),
  limit = 5
): Promise<ProductoMasVendidoHoy[]> {
  const { start, end } = getDayRange(fecha);

  const detalles = await prisma.detalleVenta.findMany({
    where: {
      venta: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    },
    select: {
      cantidad: true,
      subtotal: true,
      producto: {
        select: {
          id: true,
          nombre: true,
          codigo: true,
          categoria: true,
        },
      },
    },
  });

  const agrupados = new Map<number, ProductoMasVendidoHoy>();

  for (const detalle of detalles) {
    const actual = agrupados.get(detalle.producto.id);

    if (actual) {
      actual.unidadesVendidas += detalle.cantidad;
      actual.ingresos = roundMoney(actual.ingresos + detalle.subtotal);
      actual.items += 1;
      continue;
    }

    agrupados.set(detalle.producto.id, {
      id: detalle.producto.id,
      nombre: detalle.producto.nombre,
      codigo: detalle.producto.codigo,
      categoria: detalle.producto.categoria,
      unidadesVendidas: detalle.cantidad,
      ingresos: roundMoney(detalle.subtotal),
      items: 1,
    });
  }

  return Array.from(agrupados.values())
    .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas || b.ingresos - a.ingresos || a.nombre.localeCompare(b.nombre))
    .slice(0, limit);
}

export async function crearCliente(data: {
  nombre: unknown;
  dni: unknown;
  telefono?: unknown;
  email?: unknown;
}) {
  const nombre = normalizeText(data.nombre, "nombre");
  const dni = normalizeText(data.dni, "dni");
  const telefono = typeof data.telefono === "string" && data.telefono.trim() ? data.telefono.trim() : null;
  const email = typeof data.email === "string" && data.email.trim() ? data.email.trim() : null;

  try {
    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        dni,
        telefono,
        email,
      },
    });

    return mapCliente(cliente);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError("El DNI ya está registrado.");
    }

    throw error;
  }
}

export async function crearVenta(data: CrearVentaInput, usuarioId: number) {
  const clienteId = normalizeNumber(data.clienteId, "clienteId", 1);
  const discount = roundMoney(normalizeNumber(data.discount ?? 0, "discount", 0));

  if (!isMetodoPago(data.metodoPago)) {
    throw new ValidationError("metodoPago is invalid.");
  }

  if (!isTipoComprobante(data.comprobante)) {
    throw new ValidationError("comprobante is invalid.");
  }

  const items = normalizeItems(data.items ?? []);

  if (!items.length) {
    throw new ValidationError("The cart cannot be empty.");
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { id: true },
  });

  if (!cliente) {
    throw new NotFoundError("El cliente no existe.");
  }

  const productoIds = items.map((item) => item.productId);

  const ventaId = await prisma.$transaction(async (tx) => {
    const productos = await tx.producto.findMany({
      where: { id: { in: productoIds } },
    });

    if (productos.length !== productoIds.length) {
      throw new NotFoundError("Uno o más productos no existen.");
    }

    const productosPorId = new Map(productos.map((producto) => [producto.id, producto]));

    const detalles = items.map((item) => {
      const producto = productosPorId.get(item.productId);

      if (!producto) {
        throw new NotFoundError("Uno o más productos no existen.");
      }

      if (producto.stock < item.quantity) {
        throw new ConflictError(`Stock insuficiente para ${producto.nombre}.`);
      }

      return {
        productId: producto.id,
        quantity: item.quantity,
        precioUnit: producto.precio,
        subtotal: roundMoney(producto.precio * item.quantity),
        nombre: producto.nombre,
      };
    });

    for (const item of items) {
      const updated = await tx.producto.updateMany({
        where: {
          id: item.productId,
          stock: { gte: item.quantity },
        },
        data: {
          stock: { decrement: item.quantity },
        },
      });

      if (updated.count !== 1) {
        const producto = productosPorId.get(item.productId);
        throw new ConflictError(`Stock insuficiente para ${producto?.nombre ?? "el producto"}.`);
      }
    }

    const subtotal = roundMoney(
      detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0)
    );
    const descuento = Math.min(discount, subtotal);
    const total = roundMoney(Math.max(0, subtotal - descuento));

    const venta = await tx.venta.create({
      data: {
        clienteId,
        usuarioId,
        total,
        descuento,
        metodoPago: data.metodoPago,
        comprobante: data.comprobante,
      },
    });

    await tx.detalleVenta.createMany({
      data: detalles.map((detalle) => ({
        ventaId: venta.id,
        productoId: detalle.productId,
        cantidad: detalle.quantity,
        precioUnit: detalle.precioUnit,
        subtotal: detalle.subtotal,
      })),
    });

    return venta.id;
  });

  const venta = await obtenerVenta(ventaId);

  if (!venta) {
    throw new NotFoundError("La venta fue creada pero no pudo recuperarse.");
  }

  return venta;
}
