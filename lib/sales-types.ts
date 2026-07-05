export type MetodoPago = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";

export type TipoComprobante = "BOLETA" | "FACTURA";

export interface ProductoResumen {
  id: number;
  nombre: string;
  codigo: string;
  categoria: string;
  precio: number;
  stock: number;
  stockMinimo: number;
}

export interface ClienteResumen {
  id: number;
  nombre: string;
  dni: string;
  telefono: string | null;
  email: string | null;
}

export interface ItemVentaInput {
  productId: number;
  quantity: number;
}

export interface CrearVentaInput {
  clienteId: number;
  items: ItemVentaInput[];
  discount: number;
  metodoPago: MetodoPago;
  comprobante: TipoComprobante;
}

export interface DetalleVentaVista {
  id: number;
  cantidad: number;
  precioUnit: number;
  subtotal: number;
  producto: ProductoResumen;
}

export interface VentaVista {
  id: number;
  total: number;
  descuento: number;
  metodoPago: MetodoPago;
  comprobante: TipoComprobante;
  createdAt: string;
  cliente: ClienteResumen;
  usuario: {
    id: number;
    nombre: string;
    email: string;
  };
  detalles: DetalleVentaVista[];
}
