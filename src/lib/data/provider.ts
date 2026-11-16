import type {
  Categoria,
  ConfiguracionTienda,
  Cupon,
  Direccion,
  ItemCarrito,
  Marca,
  MetodoEnvio,
  MetodoPago,
  MovimientoInventario,
  Pedido,
  Perfil,
  Producto,
  Resena,
  Rol,
  EstadoPedido,
} from "@/types";

/* ============================================================
   Interfaz de la capa de datos.
   Dos implementaciones:
     - local   → almacenamiento JSON persistente (demo / dev)
     - supabase → PostgreSQL + RLS (producción)
   La aplicación SOLO habla con esta interfaz.
   ============================================================ */

export interface FiltroProductos {
  q?: string;
  categoria?: string;
  pais?: "japon" | "corea";
  marca?: string;
  soloOfertas?: boolean;
  soloDestacados?: boolean;
  soloNuevos?: boolean;
  minPrecio?: number;
  maxPrecio?: number;
  orden?: "vendidos" | "recientes" | "precio_asc" | "precio_desc" | "valorados";
  pagina?: number;
  porPagina?: number;
  incluirInactivos?: boolean;
}

export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
  pagina: number;
  paginas: number;
}

export interface EstadisticasDashboard {
  ventasTotales: number;
  ventasHoy: number;
  ventasMes: number;
  pedidosPendientes: number;
  pedidosCompletados: number;
  pedidosTotales: number;
  productosDisponibles: number;
  productosAgotados: number;
  productosBajos: number;
  clientes: number;
  ticketPromedio: number;
  topProductos: { nombre: string; slug: string; unidades: number; ingresos: number }[];
  serieVentas: { fecha: string; total: number }[];
  actividadReciente: { fecha: string; texto: string; tipo: string }[];
}

export interface DatosPedido {
  usuarioId: string;
  items: { productoId: string; cantidad: number }[];
  metodoPago: MetodoPago;
  metodoEnvio: MetodoEnvio;
  cuponCodigo?: string | null;
  direccion: Pedido["direccion"];
  notas?: string | null;
  envio: number;
}

export interface DataProvider {
  /* ---------- Catálogo ---------- */
  getCategorias(): Promise<Categoria[]>;
  getMarcas(): Promise<Marca[]>;
  listarProductos(filtro: FiltroProductos): Promise<ResultadoPaginado<Producto>>;
  getProductoPorSlug(slug: string): Promise<Producto | null>;
  getProductosRelacionados(slug: string, limite?: number): Promise<Producto[]>;
  getSugerencias(q: string, limite?: number): Promise<Producto[]>;
  getProductosPorIds(ids: string[]): Promise<Producto[]>;
  /** Busca por id INCLUSO si está desactivado (uso admin/edición). */
  getProductoPorId(id: string): Promise<Producto | null>;
  getProductosDestacados(limite?: number): Promise<Producto[]>;
  getProductosNuevos(limite?: number): Promise<Producto[]>;
  getMasVendidos(limite?: number): Promise<Producto[]>;

  /* ---------- Administración de productos ---------- */
  crearProducto(datos: Partial<Producto>): Promise<Producto>;
  actualizarProducto(id: string, datos: Partial<Producto>): Promise<Producto | null>;
  eliminarProducto(id: string): Promise<boolean>;
  listarProductosAdmin(filtro?: FiltroProductos): Promise<ResultadoPaginado<Producto>>;

  /* ---------- Inventario ---------- */
  ajustarStock(
    productoId: string,
    delta: number,
    motivo: string,
    actor: string
  ): Promise<{ ok: boolean; stock?: number; error?: string }>;
  getMovimientos(productoId?: string): Promise<MovimientoInventario[]>;

  /* ---------- Usuarios ---------- */
  getPerfil(id: string): Promise<Perfil | null>;
  getPerfilPorEmail(email: string): Promise<Perfil | null>;
  crearPerfil(datos: {
    id: string;
    email: string;
    nombre: string;
    apellidos: string;
    telefono?: string;
    rol?: Rol;
  }): Promise<Perfil>;
  actualizarPerfil(id: string, datos: Partial<Perfil>): Promise<Perfil | null>;
  listarUsuarios(q?: string): Promise<Perfil[]>;
  cambiarEstadoUsuario(id: string, activo: boolean): Promise<boolean>;

  /* ---------- Recuperación de contraseña ---------- */
  solicitarReset(email: string, token: string, expira: string): Promise<boolean>;
  restablecerConToken(token: string, passwordHash: string): Promise<boolean>;

  /* ---------- Contraseñas (solo modo local) ---------- */
  guardarPasswordHash(usuarioId: string, hash: string): Promise<void>;
  getPasswordHash(usuarioId: string): Promise<string | null>;
  guardarPasswordHashPorEmail(email: string, hash: string): Promise<void>;

  /* ---------- Carrito persistente ---------- */
  getCarrito(usuarioId: string): Promise<ItemCarrito[]>;
  guardarCarrito(usuarioId: string, items: ItemCarrito[]): Promise<ItemCarrito[]>;
  limpiarCarrito(usuarioId: string): Promise<void>;

  /* ---------- Favoritos ---------- */
  getFavoritos(usuarioId: string): Promise<string[]>;
  alternarFavorito(usuarioId: string, productoId: string): Promise<string[]>;

  /* ---------- Direcciones ---------- */
  getDirecciones(usuarioId: string): Promise<Direccion[]>;
  crearDireccion(datos: Omit<Direccion, "id">): Promise<Direccion>;
  actualizarDireccion(id: string, datos: Partial<Direccion>): Promise<Direccion | null>;
  eliminarDireccion(id: string): Promise<boolean>;

  /* ---------- Pedidos ---------- */
  crearPedido(datos: DatosPedido): Promise<{ ok: boolean; pedido?: Pedido; error?: string }>;
  getPedidoPorNumero(numero: string): Promise<Pedido | null>;
  getPedido(id: string): Promise<Pedido | null>;
  listarPedidosUsuario(usuarioId: string): Promise<Pedido[]>;
  listarPedidosAdmin(filtro?: {
    estado?: EstadoPedido;
    q?: string;
  }): Promise<Pedido[]>;
  actualizarEstadoPedido(
    id: string,
    estado: EstadoPedido,
    nota?: string,
    actor?: string
  ): Promise<Pedido | null>;
  confirmarPagoManual(
    id: string,
    metodo: MetodoPago,
    actor: string
  ): Promise<Pedido | null>;

  /* ---------- Reseñas ---------- */
  getResenas(productoId: string): Promise<Resena[]>;
  crearResena(resena: Omit<Resena, "id" | "creadaEn">): Promise<Resena>;
  getResenasUsuario(usuarioId: string): Promise<Resena[]>;

  /* ---------- Cupones ---------- */
  getCupones(): Promise<Cupon[]>;
  validarCupon(
    codigo: string,
    subtotal: number
  ): Promise<{ ok: boolean; cupon?: Cupon; error?: string }>;
  crearCupon(cupon: Omit<Cupon, "id" | "usosActuales">): Promise<Cupon>;
  actualizarCupon(id: string, datos: Partial<Cupon>): Promise<Cupon | null>;
  eliminarCupon(id: string): Promise<boolean>;

  /* ---------- Configuración ---------- */
  getConfiguracion(): Promise<ConfiguracionTienda>;
  guardarConfiguracion(datos: Partial<ConfiguracionTienda>): Promise<ConfiguracionTienda>;

  /* ---------- Newsletter ---------- */
  suscribir(email: string): Promise<{ ok: boolean; error?: string }>;

  /* ---------- Auditoría ---------- */
  registrarAuditoria(entrada: {
    actor: string;
    accion: string;
    detalle: string;
  }): Promise<void>;
  getAuditoria(limite?: number): Promise<
    { fecha: string; actor: string; accion: string; detalle: string }[]
  >;

  /* ---------- Estadísticas ---------- */
  getEstadisticas(): Promise<EstadisticasDashboard>;
}
