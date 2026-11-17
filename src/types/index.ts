/* ============================================================
   ITADAKIMASU — Tipos de dominio
   Compartidos por frontend, servidor y capa de datos.
   ============================================================ */

export type Rol = "customer" | "admin";

export type Pais = "japon" | "corea";

export type EstadoPedido =
  | "pendiente"
  | "pago_pendiente"
  | "pago_confirmado"
  | "preparando"
  | "en_camino"
  | "entregado"
  | "cancelado"
  | "reembolsado";

export type MetodoPago =
  | "yape"
  | "plin"
  | "transferencia"
  | "contra_entrega"
  | "pasarela";

export type MetodoEnvio = "recojo_tienda" | "delivery_local";

export type EstadoStock = "disponible" | "bajo" | "agotado";

export interface Perfil {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono?: string | null;
  rol: Rol;
  activo: boolean;
  creadoEn: string;
}

export interface Categoria {
  slug: string;
  nombre: string;
  descripcion: string;
  icono: string;
  orden: number;
}

export interface Marca {
  slug: string;
  nombre: string;
  pais: Pais;
}

export interface Producto {
  id: string;
  slug: string;
  nombre: string;
  nombreOriginal?: string | null;
  descripcion: string;
  descripcionLarga?: string | null;
  precio: number;
  precioAnterior?: number | null;
  categoriaSlug: string;
  marcaSlug: string;
  pais: Pais;
  imagenes: string[];
  ingredientes?: string[] | null;
  alergenos?: string[] | null;
  preparacion?: string | null;
  peso?: string | null;
  stock: number;
  stockMinimo: number;
  destacado: boolean;
  activo: boolean;
  etiquetas: string[];
  valoracion: number;
  numValoraciones: number;
  vendidos: number;
  esDemo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ItemCarrito {
  productoId: string;
  slug: string;
  nombre: string;
  precio: number;
  precioAnterior?: number | null;
  imagen: string;
  cantidad: number;
  stock: number;
}

export interface ResumenCarrito {
  items: ItemCarrito[];
  subtotal: number;
  descuento: number;
  envio: number;
  total: number;
  totalUnidades: number;
}

export interface Cupon {
  id: string;
  codigo: string;
  tipo: "porcentaje" | "fijo";
  valor: number;
  activo: boolean;
  fechaInicio: string | null;
  fechaFin: string | null;
  usosMaximos: number | null;
  usosActuales: number;
  compraMinima: number | null;
  descripcion?: string | null;
}

export interface Direccion {
  id: string;
  usuarioId: string;
  nombreCompleto: string;
  telefono: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  referencia?: string | null;
  indicaciones?: string | null;
  porDefecto: boolean;
}

export interface OrderItem {
  productoId: string;
  slug: string;
  nombre: string;
  imagen: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  numero: string;
  usuarioId: string;
  estado: EstadoPedido;
  metodoPago: MetodoPago;
  metodoEnvio: MetodoEnvio;
  items: OrderItem[];
  subtotal: number;
  descuento: number;
  cuponCodigo: string | null;
  envio: number;
  total: number;
  direccion: {
    nombreCompleto: string;
    telefono: string;
    departamento: string;
    provincia: string;
    distrito: string;
    direccion: string;
    referencia?: string | null;
    indicaciones?: string | null;
  };
  notas?: string | null;
  creadoEn: string;
  actualizadoEn: string;
  historial: { estado: EstadoPedido; fecha: string; nota?: string }[];
}

export interface Resena {
  id: string;
  productoId: string;
  usuarioId: string;
  usuarioNombre: string;
  calificacion: number;
  titulo: string;
  comentario: string;
  creadaEn: string;
}

export interface MovimientoInventario {
  id: string;
  productoId: string;
  productoNombre: string;
  tipo: "entrada" | "salida" | "ajuste" | "venta";
  cantidad: number;
  stockResultante: number;
  motivo: string;
  fecha: string;
  autor: string;
}

export interface ConfiguracionTienda {
  nombre: string;
  lema: string;
  telefono: string;
  correo: string;
  direccion: string;
  horario: string;
  redes: { instagram?: string; tiktok?: string; facebook?: string; whatsapp?: string };
  envioCostoLocal: number;
  envioGratisDesde: number;
  recojoGratuito: boolean;
  autollenarUbicacionCheckout: boolean;
  metodosPago: { yape: boolean; plin: boolean; transferencia: boolean; contraEntrega: boolean; pasarela: boolean };
  mensajeBoasvindas: string;
}

export interface ResultadoAccion {
  ok: boolean;
  error?: string;
  campo?: string;
  datos?: Record<string, unknown>;
}
