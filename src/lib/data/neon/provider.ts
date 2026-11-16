import type { PoolClient } from "pg";
import type {
  Categoria,
  ConfiguracionTienda,
  Cupon,
  Direccion,
  EstadoPedido,
  ItemCarrito,
  Marca,
  MetodoPago,
  MovimientoInventario,
  OrderItem,
  Pedido,
  Perfil,
  Producto,
  Resena,
} from "@/types";
import type {
  DataProvider,
  DatosPedido,
  EstadisticasDashboard,
  FiltroProductos,
  ResultadoPaginado,
} from "@/lib/data/provider";
import { CONFIG_SEED } from "@/lib/data/seed";
import { ahora, esDuplicado, nuevoId, query, queryUno, transaccion } from "./db";

/* ============================================================
   Implementación PostgreSQL (Neon) del proveedor de datos.
   Traduce cada método de DataProvider a SQL; replica la lógica
   (y los mensajes de error) del proveedor local, pero con
   bloqueos reales (SELECT ... FOR UPDATE) en operaciones
   críticas como la creación de pedidos.
   ============================================================ */

/* ---------------- Tipos de fila (snake_case) ---------------- */

type FilaProducto = {
  id: string;
  slug: string;
  nombre: string;
  nombre_original: string | null;
  descripcion: string;
  descripcion_larga: string | null;
  precio: number;
  precio_anterior: number | null;
  categoria_slug: string;
  marca_slug: string;
  pais: "japon" | "corea";
  imagenes: string[] | null;
  ingredientes: string[] | null;
  alergenos: string[] | null;
  preparacion: string | null;
  peso: string | null;
  stock: number;
  stock_minimo: number;
  destacado: boolean;
  activo: boolean;
  etiquetas: string[] | null;
  valoracion: number;
  num_valoraciones: number;
  vendidos: number;
  es_demo: boolean;
  creado_en: string;
  actualizado_en: string;
};

type FilaPerfil = {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono: string | null;
  rol: "customer" | "admin";
  activo: boolean;
  password_hash: string | null;
  reset_token: string | null;
  reset_expires: string | null;
  creado_en: string;
};

type FilaCupon = {
  id: string;
  codigo: string;
  tipo: "porcentaje" | "fijo";
  valor: number;
  activo: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  usos_maximos: number | null;
  usos_actuales: number;
  compra_minima: number | null;
  descripcion: string | null;
  creado_en: string;
};

type FilaPedido = {
  id: string;
  numero: string;
  usuario_id: string;
  estado: EstadoPedido;
  metodo_pago: MetodoPago;
  metodo_envio: "recojo_tienda" | "delivery_local";
  subtotal: number;
  descuento: number;
  cupon_codigo: string | null;
  envio: number;
  total: number;
  direccion: Pedido["direccion"];
  notas: string | null;
  creado_en: string;
  actualizado_en: string;
  historial: { estado: EstadoPedido; fecha: string; nota?: string }[];
};

/** Función de consulta que devuelve directamente las filas.
 *  Con el pool: `query`. Dentro de una transacción: `buscarDe(cliente)`. */
type Buscar = (sql: string, params?: unknown[]) => Promise<unknown[]>;

function buscarDe(cliente: PoolClient): Buscar {
  return async (sql, params = []) => (await cliente.query(sql, params)).rows;
}

/* ---------------- Mappers ---------------- */

function aProducto(f: FilaProducto): Producto {
  return {
    id: f.id,
    slug: f.slug,
    nombre: f.nombre,
    nombreOriginal: f.nombre_original ?? null,
    descripcion: f.descripcion ?? "",
    descripcionLarga: f.descripcion_larga ?? null,
    precio: Number(f.precio),
    precioAnterior: f.precio_anterior ?? null,
    categoriaSlug: f.categoria_slug,
    marcaSlug: f.marca_slug,
    pais: f.pais,
    imagenes: f.imagenes ?? [],
    ingredientes: f.ingredientes ?? null,
    alergenos: f.alergenos ?? null,
    preparacion: f.preparacion ?? null,
    peso: f.peso ?? null,
    stock: Number(f.stock),
    stockMinimo: Number(f.stock_minimo),
    destacado: !!f.destacado,
    activo: !!f.activo,
    etiquetas: f.etiquetas ?? [],
    valoracion: Number(f.valoracion),
    numValoraciones: Number(f.num_valoraciones),
    vendidos: Number(f.vendidos),
    esDemo: !!f.es_demo,
    creadoEn: f.creado_en,
    actualizadoEn: f.actualizado_en,
  };
}

function aPerfil(f: FilaPerfil): Perfil {
  return {
    id: f.id,
    email: f.email,
    nombre: f.nombre,
    apellidos: f.apellidos,
    telefono: f.telefono,
    rol: f.rol,
    activo: !!f.activo,
    creadoEn: f.creado_en,
  };
}

function aCupon(f: FilaCupon): Cupon {
  return {
    id: f.id,
    codigo: f.codigo,
    tipo: f.tipo,
    valor: Number(f.valor),
    activo: !!f.activo,
    fechaInicio: f.fecha_inicio ?? null,
    fechaFin: f.fecha_fin ?? null,
    usosMaximos: f.usos_maximos ?? null,
    usosActuales: Number(f.usos_actuales),
    compraMinima: f.compra_minima ?? null,
    descripcion: f.descripcion ?? null,
  };
}

type FilaDireccion = {
  id: string;
  usuario_id: string;
  nombre_completo: string;
  telefono: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  referencia: string | null;
  indicaciones: string | null;
  por_defecto: boolean;
};

function aDireccion(f: FilaDireccion): Direccion {
  return {
    id: f.id,
    usuarioId: f.usuario_id,
    nombreCompleto: f.nombre_completo,
    telefono: f.telefono,
    departamento: f.departamento,
    provincia: f.provincia,
    distrito: f.distrito,
    direccion: f.direccion,
    referencia: f.referencia ?? null,
    indicaciones: f.indicaciones ?? null,
    porDefecto: !!f.por_defecto,
  };
}

function aPedido(f: FilaPedido, items: OrderItem[]): Pedido {
  return {
    id: f.id,
    numero: f.numero,
    usuarioId: f.usuario_id,
    estado: f.estado,
    metodoPago: f.metodo_pago,
    metodoEnvio: f.metodo_envio,
    items,
    subtotal: Number(f.subtotal),
    descuento: Number(f.descuento),
    cuponCodigo: f.cupon_codigo ?? null,
    envio: Number(f.envio),
    total: Number(f.total),
    direccion: f.direccion,
    notas: f.notas ?? null,
    creadoEn: f.creado_en,
    actualizadoEn: f.actualizado_en,
    historial: f.historial ?? [],
  };
}

/* ---------------- Consultas auxiliares ---------------- */

function condicionesProductos(filtro: FiltroProductos): { where: string; params: unknown[] } {
  const params: unknown[] = [];
  const partes: string[] = [];
  const ref = (valor: unknown): string => {
    params.push(valor);
    return `$${params.length}`;
  };

  if (!filtro.incluirInactivos) partes.push("activo = TRUE");

  const q = filtro.q?.trim();
  if (q) {
    const r = ref(`%${q}%`);
    partes.push(
      `(nombre ILIKE ${r} OR coalesce(nombre_original, '') ILIKE ${r} OR descripcion ILIKE ${r} OR array_to_string(coalesce(etiquetas, '{}'), ' ') ILIKE ${r} OR marca_slug ILIKE ${r})`
    );
  }
  if (filtro.categoria) partes.push(`categoria_slug = ${ref(filtro.categoria)}`);
  if (filtro.pais) partes.push(`pais = ${ref(filtro.pais)}`);
  if (filtro.marca) partes.push(`marca_slug = ${ref(filtro.marca)}`);
  if (filtro.soloOfertas) partes.push("precio_anterior IS NOT NULL AND precio_anterior > precio");
  if (filtro.soloDestacados) partes.push("destacado = TRUE");
  if (filtro.soloNuevos) partes.push("creado_en >= now() - INTERVAL '60 days'");
  if (filtro.minPrecio != null) partes.push(`precio >= ${ref(filtro.minPrecio)}`);
  if (filtro.maxPrecio != null) partes.push(`precio <= ${ref(filtro.maxPrecio)}`);

  return { where: partes.length ? `WHERE ${partes.join(" AND ")}` : "", params };
}

function ordenProductos(orden: FiltroProductos["orden"]): string {
  switch (orden) {
    case "precio_asc":
      return "precio ASC, id ASC";
    case "precio_desc":
      return "precio DESC, id ASC";
    case "recientes":
      return "creado_en DESC, id ASC";
    case "valorados":
      return "valoracion DESC, id ASC";
    case "vendidos":
    default:
      return "vendidos DESC, id ASC";
  }
}

async function paginarProductos(
  filtro: FiltroProductos,
  porDefecto: number
): Promise<ResultadoPaginado<Producto>> {
  const { where, params } = condicionesProductos(filtro);
  const porPagina = Math.min(Math.max(filtro.porPagina ?? porDefecto, 1), 60);
  const pagina = Math.max(filtro.pagina ?? 1, 1);

  const conteo = await queryUno<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM productos ${where}`,
    params
  );
  const total = Number(conteo?.total ?? 0);
  const paginas = Math.max(Math.ceil(total / porPagina), 1);
  const desplazamiento = (pagina - 1) * porPagina;

  const filas = await query<FilaProducto>(
    `SELECT * FROM productos ${where} ORDER BY ${ordenProductos(filtro.orden)} LIMIT ${porPagina} OFFSET ${desplazamiento}`,
    params
  );

  return { items: filas.map(aProducto), total, pagina, paginas };
}

/** Carga los items de uno o varios pedidos y los agrupa por pedido_id. */
async function itemsDePedidos(
  buscar: Buscar,
  pedidos: FilaPedido[]
): Promise<Map<string, OrderItem[]>> {
  const mapa = new Map<string, OrderItem[]>();
  if (pedidos.length === 0) return mapa;
  const ids = pedidos.map((p) => p.id);
  const filas = await buscar(
    `SELECT * FROM pedido_items WHERE pedido_id = ANY($1::text[]) ORDER BY posicion`,
    [ids]
  );
  for (const crudo of filas) {
    const f = crudo as {
      pedido_id: string;
      producto_id: string;
      slug: string;
      nombre: string;
      imagen: string;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
    };
    const lista = mapa.get(f.pedido_id) ?? [];
    lista.push({
      productoId: f.producto_id,
      slug: f.slug,
      nombre: f.nombre,
      imagen: f.imagen,
      cantidad: Number(f.cantidad),
      precioUnitario: Number(f.precio_unitario),
      subtotal: Number(f.subtotal),
    });
    mapa.set(f.pedido_id, lista);
  }
  return mapa;
}

async function aPedidos(filas: FilaPedido[], buscar: Buscar = query as unknown as Buscar): Promise<Pedido[]> {
  const mapa = await itemsDePedidos(buscar, filas);
  return filas.map((f) => aPedido(f, mapa.get(f.id) ?? []));
}

async function leerCarrito(usuarioId: string): Promise<ItemCarrito[]> {
  const filas = await query<{
    producto_id: string;
    cantidad: number;
    slug: string;
    nombre: string;
    precio: number;
    precio_anterior: number | null;
    imagenes: string[] | null;
    stock: number;
  }>(
    `SELECT ci.producto_id, ci.cantidad, p.slug, p.nombre, p.precio, p.precio_anterior, p.imagenes, p.stock
       FROM carrito_items ci
       INNER JOIN productos p ON p.id = ci.producto_id
      WHERE ci.usuario_id = $1
      ORDER BY ci.posicion`,
    [usuarioId]
  );
  return filas.map((f) => ({
    productoId: f.producto_id,
    slug: f.slug,
    nombre: f.nombre,
    precio: Number(f.precio),
    precioAnterior: f.precio_anterior ?? null,
    imagen: f.imagenes?.[0] ?? "/logo.png",
    cantidad: Number(f.cantidad),
    stock: Number(f.stock),
  }));
}

/** Lee la configuración. `buscar` permite usar el cliente de una transacción
 *  en curso en vez de abrir una segunda conexión del pool (que podría
 *  bloquearse esperando a la transacción que la pidió). */
async function obtenerConfig(buscar: Buscar = query as unknown as Buscar): Promise<ConfiguracionTienda> {
  const filas = await buscar(`SELECT datos FROM configuracion WHERE clave = 'tienda'`);
  const fila = (filas[0] ?? null) as { datos: ConfiguracionTienda } | null;
  return { ...CONFIG_SEED, ...(fila?.datos ?? {}) };
}

/* ---------------- Columnas para actualizaciones ---------------- */

const COL_PERFIL: Record<string, string> = {
  email: "email",
  nombre: "nombre",
  apellidos: "apellidos",
  telefono: "telefono",
};

const COL_PRODUCTO: Record<string, string> = {
  slug: "slug",
  nombre: "nombre",
  nombreOriginal: "nombre_original",
  descripcion: "descripcion",
  descripcionLarga: "descripcion_larga",
  precio: "precio",
  precioAnterior: "precio_anterior",
  categoriaSlug: "categoria_slug",
  marcaSlug: "marca_slug",
  pais: "pais",
  imagenes: "imagenes",
  ingredientes: "ingredientes",
  alergenos: "alergenos",
  preparacion: "preparacion",
  peso: "peso",
  stock: "stock",
  stockMinimo: "stock_minimo",
  destacado: "destacado",
  activo: "activo",
  etiquetas: "etiquetas",
  valoracion: "valoracion",
  numValoraciones: "num_valoraciones",
  vendidos: "vendidos",
  esDemo: "es_demo",
};

const COL_CUPON: Record<string, string> = {
  codigo: "codigo",
  tipo: "tipo",
  valor: "valor",
  activo: "activo",
  fechaInicio: "fecha_inicio",
  fechaFin: "fecha_fin",
  usosMaximos: "usos_maximos",
  usosActuales: "usos_actuales",
  compraMinima: "compra_minima",
  descripcion: "descripcion",
};

function construirSet(
  datos: Record<string, unknown>,
  columnas: Record<string, string>,
  params: unknown[]
): string {
  const partes: string[] = [];
  for (const [clave, valor] of Object.entries(datos)) {
    const columna = columnas[clave];
    if (!columna || valor === undefined) continue;
    params.push(valor);
    partes.push(`${columna} = $${params.length}`);
  }
  return partes.join(", ");
}

/* ============================================================
   Proveedor
   ============================================================ */

export const proveedorNeon: DataProvider = {
  /* ---------------- Catálogo ---------------- */

  async getCategorias(): Promise<Categoria[]> {
    const filas = await query<{ slug: string; nombre: string; descripcion: string; icono: string; orden: number }>(
      `SELECT * FROM categorias ORDER BY orden, nombre`
    );
    return filas.map((f) => ({
      slug: f.slug,
      nombre: f.nombre,
      descripcion: f.descripcion,
      icono: f.icono,
      orden: Number(f.orden),
    }));
  },

  async getMarcas(): Promise<Marca[]> {
    return query<Marca>(`SELECT slug, nombre, pais FROM marcas ORDER BY nombre`);
  },

  async listarProductos(filtro): Promise<ResultadoPaginado<Producto>> {
    return paginarProductos(filtro, 12);
  },

  async getProductoPorSlug(slug): Promise<Producto | null> {
    const f = await queryUno<FilaProducto>(
      `SELECT * FROM productos WHERE slug = $1 AND activo = TRUE`,
      [slug]
    );
    return f ? aProducto(f) : null;
  },

  async getProductosRelacionados(slug, limite = 4): Promise<Producto[]> {
    const filas = await query<FilaProducto>(
      `SELECT * FROM productos
        WHERE activo = TRUE
          AND slug <> $1
          AND (
            categoria_slug = (SELECT categoria_slug FROM productos WHERE slug = $1)
            OR pais = (SELECT pais FROM productos WHERE slug = $1)
          )
        ORDER BY valoracion DESC, vendidos DESC, id ASC
        LIMIT $2`,
      [slug, Math.max(1, Math.floor(limite))]
    );
    return filas.map(aProducto);
  },

  async getSugerencias(q, limite = 6): Promise<Producto[]> {
    const texto = q.trim();
    if (!texto) return [];
    const pat = `%${texto}%`;
    const filas = await query<FilaProducto>(
      `SELECT * FROM productos
        WHERE activo = TRUE
          AND (nombre ILIKE $1 OR coalesce(nombre_original, '') ILIKE $1 OR marca_slug ILIKE $1)
        ORDER BY vendidos DESC, id ASC
        LIMIT $2`,
      [pat, Math.max(1, Math.floor(limite))]
    );
    return filas.map(aProducto);
  },

  async getProductosPorIds(ids): Promise<Producto[]> {
    if (ids.length === 0) return [];
    const filas = await query<FilaProducto>(
      `SELECT * FROM productos
        WHERE id = ANY($1::text[]) AND activo = TRUE
        ORDER BY array_position($1::text[], id)`,
      [ids]
    );
    return filas.map(aProducto);
  },

  async getProductoPorId(id): Promise<Producto | null> {
    const f = await queryUno<FilaProducto>(`SELECT * FROM productos WHERE id = $1`, [id]);
    return f ? aProducto(f) : null;
  },

  async getProductosDestacados(limite = 8): Promise<Producto[]> {
    const filas = await query<FilaProducto>(
      `SELECT * FROM productos WHERE activo = TRUE AND destacado = TRUE
        ORDER BY vendidos DESC, id ASC LIMIT $1`,
      [Math.max(1, Math.floor(limite))]
    );
    return filas.map(aProducto);
  },

  async getProductosNuevos(limite = 8): Promise<Producto[]> {
    const filas = await query<FilaProducto>(
      `SELECT * FROM productos WHERE activo = TRUE
        ORDER BY creado_en DESC, id ASC LIMIT $1`,
      [Math.max(1, Math.floor(limite))]
    );
    return filas.map(aProducto);
  },

  async getMasVendidos(limite = 8): Promise<Producto[]> {
    const filas = await query<FilaProducto>(
      `SELECT * FROM productos WHERE activo = TRUE
        ORDER BY vendidos DESC, id ASC LIMIT $1`,
      [Math.max(1, Math.floor(limite))]
    );
    return filas.map(aProducto);
  },

  /* ---------------- Administración de productos ---------------- */

  async crearProducto(datos): Promise<Producto> {
    const fecha = ahora();
    const producto: Producto = {
      id: nuevoId("prod"),
      slug: datos.slug!,
      nombre: datos.nombre!,
      nombreOriginal: datos.nombreOriginal ?? null,
      descripcion: datos.descripcion ?? "",
      descripcionLarga: datos.descripcionLarga ?? null,
      precio: datos.precio ?? 0,
      precioAnterior: datos.precioAnterior ?? null,
      categoriaSlug: datos.categoriaSlug ?? "snacks",
      marcaSlug: datos.marcaSlug ?? "itadakimasu",
      pais: datos.pais ?? "japon",
      imagenes: datos.imagenes ?? [],
      ingredientes: datos.ingredientes ?? null,
      alergenos: datos.alergenos ?? null,
      preparacion: datos.preparacion ?? null,
      peso: datos.peso ?? null,
      stock: datos.stock ?? 0,
      stockMinimo: datos.stockMinimo ?? 5,
      destacado: datos.destacado ?? false,
      activo: datos.activo ?? true,
      etiquetas: datos.etiquetas ?? [],
      valoracion: datos.valoracion ?? 0,
      numValoraciones: 0,
      vendidos: 0,
      esDemo: false,
      creadoEn: fecha,
      actualizadoEn: fecha,
    };

    const fila = await queryUno<FilaProducto>(
      `INSERT INTO productos (
         id, slug, nombre, nombre_original, descripcion, descripcion_larga,
         precio, precio_anterior, categoria_slug, marca_slug, pais, imagenes,
         ingredientes, alergenos, preparacion, peso, stock, stock_minimo,
         destacado, activo, etiquetas, valoracion, num_valoraciones, vendidos,
         es_demo, creado_en, actualizado_en
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
         $19,$20,$21,$22,$23,$24,$25,$26,$26
       ) RETURNING *`,
      [
        producto.id,
        producto.slug,
        producto.nombre,
        producto.nombreOriginal,
        producto.descripcion,
        producto.descripcionLarga,
        producto.precio,
        producto.precioAnterior,
        producto.categoriaSlug,
        producto.marcaSlug,
        producto.pais,
        producto.imagenes,
        producto.ingredientes,
        producto.alergenos,
        producto.preparacion,
        producto.peso,
        producto.stock,
        producto.stockMinimo,
        producto.destacado,
        producto.activo,
        producto.etiquetas,
        producto.valoracion,
        producto.numValoraciones,
        producto.vendidos,
        producto.esDemo,
        fecha,
      ]
    );
    return aProducto(fila!);
  },

  async actualizarProducto(id, datos): Promise<Producto | null> {
    const params: unknown[] = [];
    const set = construirSet({ ...datos } as Record<string, unknown>, COL_PRODUCTO, params);
    params.push(ahora()); // actualizado_en
    const colFecha = `$${params.length}`;
    params.push(id);
    const colId = `$${params.length}`;
    const campos = set ? `${set}, ` : "";
    const fila = await queryUno<FilaProducto>(
      `UPDATE productos SET ${campos} actualizado_en = ${colFecha}
        WHERE id = ${colId} RETURNING *`,
      params
    );
    return fila ? aProducto(fila) : null;
  },

  async eliminarProducto(id): Promise<boolean> {
    const fila = await queryUno<{ id: string }>(
      `UPDATE productos SET activo = FALSE, actualizado_en = now() WHERE id = $1 RETURNING id`,
      [id]
    );
    return !!fila;
  },

  async listarProductosAdmin(filtro = {}): Promise<ResultadoPaginado<Producto>> {
    return paginarProductos({ ...filtro, incluirInactivos: true }, 60);
  },

  /* ---------------- Inventario ---------------- */

  async ajustarStock(productoId, delta, motivo, actor) {
    return transaccion(async (c) => {
      const lectura = await c.query(`SELECT id, nombre, stock FROM productos WHERE id = $1 FOR UPDATE`, [
        productoId,
      ]);
      const producto = lectura.rows[0] as { id: string; nombre: string; stock: number } | undefined;
      if (!producto) return { ok: false, error: "Producto no encontrado" };

      const nuevoStock = Math.max(0, Number(producto.stock) + delta);
      await c.query(`UPDATE productos SET stock = $1, actualizado_en = now() WHERE id = $2`, [
        nuevoStock,
        productoId,
      ]);

      const tipo = delta > 0 ? "entrada" : delta < 0 ? "salida" : "ajuste";
      await c.query(
        `INSERT INTO movimientos_inventario
           (id, producto_id, producto_nombre, tipo, cantidad, stock_resultante, motivo, fecha, autor)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [nuevoId("mov"), productoId, producto.nombre, tipo, Math.abs(delta), nuevoStock, motivo, ahora(), actor]
      );

      await c.query(`INSERT INTO auditoria (fecha, actor, accion, detalle) VALUES ($1,$2,$3,$4)`, [
        ahora(),
        actor,
        "inventario",
        `${producto.nombre}: ${delta > 0 ? "+" : ""}${delta} (${motivo})`,
      ]);

      return { ok: true, stock: nuevoStock };
    });
  },

  async getMovimientos(productoId): Promise<MovimientoInventario[]> {
    const filas = await query<{
      id: string;
      producto_id: string;
      producto_nombre: string;
      tipo: "entrada" | "salida" | "ajuste" | "venta";
      cantidad: number;
      stock_resultante: number;
      motivo: string;
      fecha: string;
      autor: string;
    }>(
      `SELECT * FROM movimientos_inventario
        WHERE ($1::text IS NULL OR producto_id = $1)
        ORDER BY fecha DESC`,
      [productoId ?? null]
    );
    return filas.map((f) => ({
      id: f.id,
      productoId: f.producto_id,
      productoNombre: f.producto_nombre,
      tipo: f.tipo,
      cantidad: Number(f.cantidad),
      stockResultante: Number(f.stock_resultante),
      motivo: f.motivo,
      fecha: f.fecha,
      autor: f.autor,
    }));
  },

  /* ---------------- Usuarios ---------------- */

  async getPerfil(id): Promise<Perfil | null> {
    const f = await queryUno<FilaPerfil>(`SELECT * FROM perfiles WHERE id = $1`, [id]);
    return f ? aPerfil(f) : null;
  },

  async getPerfilPorEmail(email): Promise<Perfil | null> {
    const f = await queryUno<FilaPerfil>(
      `SELECT * FROM perfiles WHERE lower(email) = lower($1)`,
      [email.trim()]
    );
    return f ? aPerfil(f) : null;
  },

  async crearPerfil(datos): Promise<Perfil> {
    try {
      const fila = await queryUno<FilaPerfil>(
        `INSERT INTO perfiles (id, email, nombre, apellidos, telefono, rol, activo, creado_en)
         VALUES ($1, lower($2), $3, $4, $5, $6, TRUE, $7)
         RETURNING *`,
        [
          datos.id,
          datos.email.toLowerCase(),
          datos.nombre,
          datos.apellidos,
          datos.telefono ?? null,
          datos.rol ?? "customer",
          ahora(),
        ]
      );
      return aPerfil(fila!);
    } catch (error) {
      if (esDuplicado(error)) throw new Error("El correo ya está registrado");
      throw error;
    }
  },

  async actualizarPerfil(id, datos): Promise<Perfil | null> {
    const campos = { ...datos } as Record<string, unknown>;
    delete campos.rol;
    delete campos.activo;
    delete campos.id;
    delete campos.creadoEn;

    const params: unknown[] = [];
    const set = construirSet(campos, COL_PERFIL, params);
    if (!set) {
      const sinCambios = await queryUno<FilaPerfil>(`SELECT * FROM perfiles WHERE id = $1`, [id]);
      return sinCambios ? aPerfil(sinCambios) : null;
    }
    params.push(id);
    const fila = await queryUno<FilaPerfil>(
      `UPDATE perfiles SET ${set} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return fila ? aPerfil(fila) : null;
  },

  async listarUsuarios(q): Promise<Perfil[]> {
    const texto = q?.trim() ?? "";
    const filas = await query<FilaPerfil>(
      `SELECT * FROM perfiles
        WHERE ($1 = '' OR (nombre || ' ' || apellidos || ' ' || email) ILIKE '%' || $1 || '%')
        ORDER BY creado_en DESC, id DESC`,
      [texto]
    );
    return filas.map(aPerfil);
  },

  async cambiarEstadoUsuario(id, activo): Promise<boolean> {
    const fila = await queryUno<{ id: string }>(
      `UPDATE perfiles SET activo = $1 WHERE id = $2 RETURNING id`,
      [activo, id]
    );
    return !!fila;
  },

  /* ---------------- Recuperación de contraseña (modo local) ---------------- */

  async solicitarReset(email, token, expira): Promise<boolean> {
    const fila = await queryUno<{ id: string }>(
      `UPDATE perfiles SET reset_token = $1, reset_expires = $2
        WHERE lower(email) = lower($3) RETURNING id`,
      [token, expira, email]
    );
    return !!fila;
  },

  async restablecerConToken(token, passwordHash): Promise<boolean> {
    const fila = await queryUno<{ id: string }>(
      `UPDATE perfiles SET password_hash = $1, reset_token = NULL, reset_expires = NULL
        WHERE reset_token = $2 AND reset_expires > now() RETURNING id`,
      [passwordHash, token]
    );
    return !!fila;
  },

  async guardarPasswordHash(usuarioId, hash): Promise<void> {
    await query(`UPDATE perfiles SET password_hash = $1 WHERE id = $2`, [hash, usuarioId]);
  },

  async getPasswordHash(usuarioId): Promise<string | null> {
    const f = await queryUno<{ password_hash: string | null }>(
      `SELECT password_hash FROM perfiles WHERE id = $1`,
      [usuarioId]
    );
    return f?.password_hash ?? null;
  },

  async guardarPasswordHashPorEmail(email, hash): Promise<void> {
    await query(`UPDATE perfiles SET password_hash = $1 WHERE lower(email) = lower($2)`, [
      hash,
      email,
    ]);
  },

  /* ---------------- Carrito persistente ---------------- */

  async getCarrito(usuarioId): Promise<ItemCarrito[]> {
    return leerCarrito(usuarioId);
  },

  async guardarCarrito(usuarioId, items): Promise<ItemCarrito[]> {
    await transaccion(async (c) => {
      await c.query(`DELETE FROM carrito_items WHERE usuario_id = $1`, [usuarioId]);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const cantidad = Math.max(1, Math.floor(item.cantidad));
        await c.query(
          `INSERT INTO carrito_items (usuario_id, producto_id, cantidad, posicion)
           SELECT $1, p.id, $2, $3 FROM productos p WHERE p.id = $4
           ON CONFLICT (usuario_id, producto_id)
           DO UPDATE SET cantidad = EXCLUDED.cantidad, posicion = EXCLUDED.posicion`,
          [usuarioId, cantidad, i, item.productoId]
        );
      }
    });
    return leerCarrito(usuarioId);
  },

  async limpiarCarrito(usuarioId): Promise<void> {
    await query(`DELETE FROM carrito_items WHERE usuario_id = $1`, [usuarioId]);
  },

  /* ---------------- Favoritos ---------------- */

  async getFavoritos(usuarioId): Promise<string[]> {
    const filas = await query<{ producto_id: string }>(
      `SELECT producto_id FROM favoritos WHERE usuario_id = $1 ORDER BY creado_en, producto_id`,
      [usuarioId]
    );
    return filas.map((f) => f.producto_id);
  },

  async alternarFavorito(usuarioId, productoId): Promise<string[]> {
    return transaccion(async (c) => {
      const borrado = await c.query(
        `DELETE FROM favoritos WHERE usuario_id = $1 AND producto_id = $2`,
        [usuarioId, productoId]
      );
      if (!borrado.rowCount) {
        await c.query(
          `INSERT INTO favoritos (usuario_id, producto_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [usuarioId, productoId]
        );
      }
      const filas = await c.query(
        `SELECT producto_id FROM favoritos WHERE usuario_id = $1 ORDER BY creado_en, producto_id`,
        [usuarioId]
      );
      return filas.rows.map((f) => (f as { producto_id: string }).producto_id);
    });
  },

  /* ---------------- Direcciones ---------------- */

  async getDirecciones(usuarioId): Promise<Direccion[]> {
    const filas = await query<FilaDireccion>(
      `SELECT * FROM direcciones WHERE usuario_id = $1
        ORDER BY por_defecto DESC, id ASC`,
      [usuarioId]
    );
    return filas.map(aDireccion);
  },

  async crearDireccion(datos): Promise<Direccion> {
    return transaccion(async (c) => {
      if (datos.porDefecto) {
        await c.query(
          `UPDATE direcciones SET por_defecto = FALSE WHERE usuario_id = $1 AND por_defecto = TRUE`,
          [datos.usuarioId]
        );
      }
      const id = nuevoId("dir");
      await c.query(
        `INSERT INTO direcciones
           (id, usuario_id, nombre_completo, telefono, departamento, provincia, distrito, direccion, referencia, indicaciones, por_defecto)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          id,
          datos.usuarioId,
          datos.nombreCompleto,
          datos.telefono,
          datos.departamento,
          datos.provincia,
          datos.distrito,
          datos.direccion,
          datos.referencia ?? null,
          datos.indicaciones ?? null,
          datos.porDefecto,
        ]
      );
      return { ...datos, id };
    });
  },

  async actualizarDireccion(id, datos): Promise<Direccion | null> {
    return transaccion(async (c) => {
      const lectura = await c.query(`SELECT * FROM direcciones WHERE id = $1 FOR UPDATE`, [id]);
      const actual = lectura.rows[0] as FilaDireccion | undefined;
      if (!actual) return null;

      if (datos.porDefecto) {
        await c.query(
          `UPDATE direcciones SET por_defecto = FALSE WHERE usuario_id = $1 AND por_defecto = TRUE AND id <> $2`,
          [actual.usuario_id, id]
        );
      }

      const mapa: Record<string, unknown> = {
        nombre_completo: datos.nombreCompleto,
        telefono: datos.telefono,
        departamento: datos.departamento,
        provincia: datos.provincia,
        distrito: datos.distrito,
        direccion: datos.direccion,
        referencia: datos.referencia,
        indicaciones: datos.indicaciones,
        por_defecto: datos.porDefecto,
      };
      const params: unknown[] = [];
      const partes: string[] = [];
      for (const [columna, valor] of Object.entries(mapa)) {
        if (valor === undefined) continue;
        params.push(valor);
        partes.push(`${columna} = $${params.length}`);
      }
      if (partes.length > 0) {
        params.push(id);
        await c.query(
          `UPDATE direcciones SET ${partes.join(", ")} WHERE id = $${params.length}`,
          params
        );
      }

      const resultado = await c.query(`SELECT * FROM direcciones WHERE id = $1`, [id]);
      const fila = resultado.rows[0] as FilaDireccion | undefined;
      return fila ? aDireccion(fila) : null;
    });
  },

  async eliminarDireccion(id): Promise<boolean> {
    const filas = await query<{ id: string }>(
      `DELETE FROM direcciones WHERE id = $1 RETURNING id`,
      [id]
    );
    return filas.length > 0;
  },

  /* ---------------- Pedidos ---------------- */

  async crearPedido(datos: DatosPedido): Promise<{ ok: boolean; pedido?: Pedido; error?: string }> {
    return transaccion(async (c) => {
      // 1) Items validados y bloqueados contra la BD (nunca confiar en precios del cliente)
      const ids = datos.items.map((i) => i.productoId);
      if (ids.length === 0) return { ok: false, error: "El carrito está vacío" };

      const lectura = await c.query(
        `SELECT * FROM productos WHERE id = ANY($1::text[]) ORDER BY id FOR UPDATE`,
        [ids]
      );
      const mapa = new Map<string, FilaProducto>();
      for (const crudo of lectura.rows) mapa.set((crudo as FilaProducto).id, crudo as FilaProducto);

      const items: OrderItem[] = [];
      let subtotal = 0;
      for (const item of datos.items) {
        const producto = mapa.get(item.productoId);
        if (!producto || !producto.activo) {
          return { ok: false, error: "Un producto ya no está disponible" };
        }
        const cantidad = Math.max(1, Math.floor(item.cantidad));
        if (Number(producto.stock) < cantidad) {
          return {
            ok: false,
            error: `Solo quedan ${producto.stock} unidades de ${producto.nombre}`,
          };
        }
        const linea = Number(producto.precio) * cantidad;
        subtotal += linea;
        items.push({
          productoId: producto.id,
          slug: producto.slug,
          nombre: producto.nombre,
          imagen: producto.imagenes?.[0] ?? "/logo.png",
          cantidad,
          precioUnitario: Number(producto.precio),
          subtotal: linea,
        });
      }
      if (items.length === 0) return { ok: false, error: "El carrito está vacío" };

      // 2) Cupón (fila bloqueada para no exceder usos en paralelo)
      let descuento = 0;
      let cupon: FilaCupon | null = null;
      if (datos.cuponCodigo) {
        const codigo = datos.cuponCodigo.trim().toUpperCase();
        const lecturaCupon = await c.query(
          `SELECT * FROM cupones WHERE upper(codigo) = $1 FOR UPDATE`,
          [codigo]
        );
        cupon = (lecturaCupon.rows[0] as FilaCupon | undefined) ?? null;
        if (!cupon || !cupon.activo) return { ok: false, error: "El cupón no existe o no está activo" };
        const hoy = Date.now();
        if (cupon.fecha_inicio && new Date(cupon.fecha_inicio).getTime() > hoy)
          return { ok: false, error: "El cupón aún no está vigente" };
        if (cupon.fecha_fin && new Date(cupon.fecha_fin).getTime() < hoy)
          return { ok: false, error: "El cupón expiró" };
        if (cupon.usos_maximos != null && Number(cupon.usos_actuales) >= Number(cupon.usos_maximos))
          return { ok: false, error: "El cupón alcanzó su límite de usos" };
        if (cupon.compra_minima != null && subtotal < Number(cupon.compra_minima))
          return {
            ok: false,
            error: `Este cupón requiere un mínimo de S/ ${Number(cupon.compra_minima).toFixed(2)}`,
          };
        descuento =
          cupon.tipo === "porcentaje"
            ? Math.round(subtotal * (Number(cupon.valor) / 100) * 100) / 100
            : Math.min(Number(cupon.valor), subtotal);
      }

      // 3) Envío recalculado en el servidor según configuración
      // (con el MISMO cliente de la transacción: nunca una 2ª conexión)
      const cfg = await obtenerConfig(buscarDe(c));
      const envioGratis = subtotal - descuento >= cfg.envioGratisDesde;
      let envio = 0;
      if (datos.metodoEnvio === "delivery_local") envio = cfg.envioCostoLocal;
      if (datos.metodoEnvio === "recojo_tienda") envio = 0;
      if (envioGratis && datos.metodoEnvio !== "recojo_tienda") envio = 0;

      const total = Math.max(0, subtotal - descuento + envio);

      // 4) Descuento de stock atómico (los productos están bloqueados con FOR UPDATE)
      for (const item of items) {
        const actualizado = await c.query(
          `UPDATE productos SET stock = stock - $1, vendidos = vendidos + $1, actualizado_en = now()
            WHERE id = $2 RETURNING stock`,
          [item.cantidad, item.productoId]
        );
        const stockResultante = Number(
          (actualizado.rows[0] as { stock: number } | undefined)?.stock ?? 0
        );
        await c.query(
          `INSERT INTO movimientos_inventario
             (id, producto_id, producto_nombre, tipo, cantidad, stock_resultante, motivo, fecha, autor)
           VALUES ($1,$2,$3,'venta',$4,$5,'Venta en pedido',$6,'sistema')`,
          [nuevoId("mov"), item.productoId, item.nombre, item.cantidad, stockResultante, ahora()]
        );
      }

      // 5) Número único de pedido (contador atómico por año)
      const anio = new Date().getFullYear();
      const contador = await c.query(
        `INSERT INTO contadores (clave, valor) VALUES ($1, 1)
           ON CONFLICT (clave) DO UPDATE SET valor = contadores.valor + 1
           RETURNING valor`,
        [`pedidos_${anio}`]
      );
      const filaContador = contador.rows[0] as { valor: string | number };
      const numero = `ITD-${anio}-${String(Number(filaContador.valor)).padStart(5, "0")}`;

      const estado: EstadoPedido =
        datos.metodoPago === "contra_entrega" ? "pendiente" : "pago_pendiente";
      const fecha = ahora();
      const id = nuevoId("ped");
      const historial = [{ estado, fecha, nota: "Pedido creado" }];

      await c.query(
        `INSERT INTO pedidos (
           id, numero, usuario_id, estado, metodo_pago, metodo_envio,
           subtotal, descuento, cupon_codigo, envio, total, direccion, notas,
           creado_en, actualizado_en, historial
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14,$15)`,
        [
          id,
          numero,
          datos.usuarioId,
          estado,
          datos.metodoPago,
          datos.metodoEnvio,
          subtotal,
          descuento,
          cupon?.codigo ?? null,
          envio,
          total,
          // node-postgres serializa los arrays como literal de array de PG;
          // para jsonb hay que mandar JSON explícito.
          JSON.stringify(datos.direccion),
          datos.notas ?? null,
          fecha,
          JSON.stringify(historial),
        ]
      );

      // 6) Items del pedido (snapshot)
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await c.query(
          `INSERT INTO pedido_items
             (pedido_id, producto_id, slug, nombre, imagen, cantidad, precio_unitario, subtotal, posicion)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [id, item.productoId, item.slug, item.nombre, item.imagen, item.cantidad, item.precioUnitario, item.subtotal, i]
        );
      }

      // 7) Uso de cupón
      if (cupon) {
        await c.query(`UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = $1`, [
          cupon.id,
        ]);
        await c.query(
          `INSERT INTO cupones_usos (id, cupon_id, codigo, usuario_id, pedido_id, fecha)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [nuevoId("uso"), cupon.id, cupon.codigo, datos.usuarioId, id, fecha]
        );
      }

      // 8) Limpiar carrito del usuario
      await c.query(`DELETE FROM carrito_items WHERE usuario_id = $1`, [datos.usuarioId]);

      // 9) Auditoría
      await c.query(`INSERT INTO auditoria (fecha, actor, accion, detalle) VALUES ($1,$2,$3,$4)`, [
        fecha,
        datos.usuarioId,
        "pedido",
        `Pedido ${numero} por S/ ${total.toFixed(2)}`,
      ]);

      const filaPedido = (
        await c.query(`SELECT * FROM pedidos WHERE id = $1`, [id])
      ).rows[0] as FilaPedido;

      return { ok: true, pedido: aPedido(filaPedido, items) };
    });
  },

  async getPedidoPorNumero(numero): Promise<Pedido | null> {
    const fila = await queryUno<FilaPedido>(`SELECT * FROM pedidos WHERE numero = $1`, [numero]);
    if (!fila) return null;
    const [pedido] = await aPedidos([fila]);
    return pedido ?? null;
  },

  async getPedido(id): Promise<Pedido | null> {
    const fila = await queryUno<FilaPedido>(`SELECT * FROM pedidos WHERE id = $1`, [id]);
    if (!fila) return null;
    const [pedido] = await aPedidos([fila]);
    return pedido ?? null;
  },

  async listarPedidosUsuario(usuarioId): Promise<Pedido[]> {
    const filas = await query<FilaPedido>(
      `SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY creado_en DESC, numero DESC`,
      [usuarioId]
    );
    return aPedidos(filas);
  },

  async listarPedidosAdmin(filtro = {}): Promise<Pedido[]> {
    const params: unknown[] = [];
    const partes: string[] = ["TRUE"];

    if (filtro.estado) {
      params.push(filtro.estado);
      partes.push(`estado = $${params.length}`);
    }
    const q = filtro.q?.trim();
    if (q) {
      params.push(`%${q}%`);
      const r = `$${params.length}`;
      partes.push(
        `(numero ILIKE ${r} OR coalesce(direccion->>'nombreCompleto', '') ILIKE ${r} OR coalesce(direccion->>'telefono', '') ILIKE ${r})`
      );
    }

    const filas = await query<FilaPedido>(
      `SELECT * FROM pedidos WHERE ${partes.join(" AND ")} ORDER BY creado_en DESC, numero DESC`,
      params
    );
    return aPedidos(filas);
  },

  async actualizarEstadoPedido(id, estado, nota, actor = "admin") {
    return transaccion(async (c) => {
      const lectura = await c.query(`SELECT * FROM pedidos WHERE id = $1 FOR UPDATE`, [id]);
      const actual = lectura.rows[0] as FilaPedido | undefined;
      if (!actual) return null;

      const fecha = ahora();
      const historial = [...(actual.historial ?? []), { estado, fecha, ...(nota ? { nota } : {}) }];
      await c.query(
        `UPDATE pedidos SET estado = $1, actualizado_en = $2, historial = $3 WHERE id = $4`,
        [estado, fecha, JSON.stringify(historial), id]
      );
      await c.query(`INSERT INTO auditoria (fecha, actor, accion, detalle) VALUES ($1,$2,$3,$4)`, [
        fecha,
        actor,
        "pedido",
        `${actual.numero} → ${estado}${nota ? ` (${nota})` : ""}`,
      ]);

      const fila = (await c.query(`SELECT * FROM pedidos WHERE id = $1`, [id])).rows[0] as FilaPedido;
      const [pedido] = await aPedidos([fila], buscarDe(c));
      return pedido ?? null;
    });
  },

  async confirmarPagoManual(id, metodo: MetodoPago, actor = "admin") {
    return transaccion(async (c) => {
      const lectura = await c.query(`SELECT * FROM pedidos WHERE id = $1 FOR UPDATE`, [id]);
      const actual = lectura.rows[0] as FilaPedido | undefined;
      if (!actual) return null;

      const fecha = ahora();
      const historial = [
        ...(actual.historial ?? []),
        { estado: "pago_confirmado" as EstadoPedido, fecha, nota: `Pago verificado por ${actor}` },
      ];
      await c.query(
        `UPDATE pedidos SET metodo_pago = $1, estado = 'pago_confirmado', actualizado_en = $2, historial = $3
          WHERE id = $4`,
        [metodo, fecha, JSON.stringify(historial), id]
      );
      await c.query(`INSERT INTO auditoria (fecha, actor, accion, detalle) VALUES ($1,$2,$3,$4)`, [
        fecha,
        actor,
        "pago",
        `Pago confirmado en ${actual.numero} (${metodo})`,
      ]);

      const fila = (await c.query(`SELECT * FROM pedidos WHERE id = $1`, [id])).rows[0] as FilaPedido;
      const [pedido] = await aPedidos([fila], buscarDe(c));
      return pedido ?? null;
    });
  },

  /* ---------------- Reseñas ---------------- */

  async getResenas(productoId): Promise<Resena[]> {
    const filas = await query<{
      id: string;
      producto_id: string;
      usuario_id: string;
      usuario_nombre: string;
      calificacion: number;
      titulo: string;
      comentario: string;
      creada_en: string;
    }>(
      `SELECT * FROM resenas WHERE producto_id = $1 ORDER BY creada_en DESC, id DESC`,
      [productoId]
    );
    return filas.map((f) => ({
      id: f.id,
      productoId: f.producto_id,
      usuarioId: f.usuario_id,
      usuarioNombre: f.usuario_nombre,
      calificacion: Number(f.calificacion),
      titulo: f.titulo,
      comentario: f.comentario,
      creadaEn: f.creada_en,
    }));
  },

  async crearResena(resena): Promise<Resena> {
    return transaccion(async (c) => {
      const id = nuevoId("res");
      const creadaEn = ahora();
      await c.query(
        `INSERT INTO resenas (id, producto_id, usuario_id, usuario_nombre, calificacion, titulo, comentario, creada_en)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, resena.productoId, resena.usuarioId, resena.usuarioNombre, resena.calificacion, resena.titulo, resena.comentario, creadaEn]
      );

      // Recalcular valoración del producto (mismo redondeo que el modo local)
      const calificaciones = await c.query(
        `SELECT calificacion FROM resenas WHERE producto_id = $1`,
        [resena.productoId]
      );
      const valores = calificaciones.rows.map((r) => Number((r as { calificacion: number }).calificacion));
      if (valores.length > 0) {
        const promedio = valores.reduce((s, v) => s + v, 0) / valores.length;
        await c.query(
          `UPDATE productos SET valoracion = $1, num_valoraciones = $2, actualizado_en = now() WHERE id = $3`,
          [Math.round(promedio * 10) / 10, valores.length, resena.productoId]
        );
      }

      return { ...resena, id, creadaEn };
    });
  },

  async getResenasUsuario(usuarioId): Promise<Resena[]> {
    const filas = await query<{
      id: string;
      producto_id: string;
      usuario_id: string;
      usuario_nombre: string;
      calificacion: number;
      titulo: string;
      comentario: string;
      creada_en: string;
    }>(`SELECT * FROM resenas WHERE usuario_id = $1 ORDER BY creada_en DESC`, [usuarioId]);
    return filas.map((f) => ({
      id: f.id,
      productoId: f.producto_id,
      usuarioId: f.usuario_id,
      usuarioNombre: f.usuario_nombre,
      calificacion: Number(f.calificacion),
      titulo: f.titulo,
      comentario: f.comentario,
      creadaEn: f.creada_en,
    }));
  },

  /* ---------------- Cupones ---------------- */

  async getCupones(): Promise<Cupon[]> {
    const filas = await query<FilaCupon>(`SELECT * FROM cupones ORDER BY creado_en, codigo`);
    return filas.map(aCupon);
  },

  async validarCupon(codigo, subtotal) {
    const fila = await queryUno<FilaCupon>(
      `SELECT * FROM cupones WHERE upper(codigo) = upper($1)`,
      [codigo.trim()]
    );
    if (!fila) return { ok: false, error: "Cupón no encontrado" };
    if (!fila.activo) return { ok: false, error: "Cupón desactivado" };
    const hoy = Date.now();
    if (fila.fecha_inicio && new Date(fila.fecha_inicio).getTime() > hoy)
      return { ok: false, error: "El cupón aún no está vigente" };
    if (fila.fecha_fin && new Date(fila.fecha_fin).getTime() < hoy)
      return { ok: false, error: "El cupón expiró" };
    if (fila.usos_maximos != null && Number(fila.usos_actuales) >= Number(fila.usos_maximos))
      return { ok: false, error: "Cupón agotado" };
    if (fila.compra_minima != null && subtotal < Number(fila.compra_minima))
      return { ok: false, error: `Compra mínima de S/ ${Number(fila.compra_minima).toFixed(2)}` };
    return { ok: true, cupon: aCupon(fila) };
  },

  async crearCupon(cupon): Promise<Cupon> {
    const id = nuevoId("cup");
    const fila = await queryUno<FilaCupon>(
      `INSERT INTO cupones (id, codigo, tipo, valor, activo, fecha_inicio, fecha_fin, usos_maximos, compra_minima, descripcion, creado_en)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        id,
        cupon.codigo,
        cupon.tipo,
        cupon.valor,
        cupon.activo,
        cupon.fechaInicio ?? null,
        cupon.fechaFin ?? null,
        cupon.usosMaximos ?? null,
        cupon.compraMinima ?? null,
        cupon.descripcion ?? null,
        ahora(),
      ]
    );
    return aCupon(fila!);
  },

  async actualizarCupon(id, datos): Promise<Cupon | null> {
    const campos = { ...datos } as Record<string, unknown>;
    delete campos.id;
    delete campos.usosActuales; // los usos solo se incrementan al crear un pedido
    const params: unknown[] = [];
    const set = construirSet(campos, COL_CUPON, params);
    if (!set) {
      const fila = await queryUno<FilaCupon>(`SELECT * FROM cupones WHERE id = $1`, [id]);
      return fila ? aCupon(fila) : null;
    }
    params.push(id);
    const fila = await queryUno<FilaCupon>(
      `UPDATE cupones SET ${set} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return fila ? aCupon(fila) : null;
  },

  async eliminarCupon(id): Promise<boolean> {
    const filas = await query<{ id: string }>(`DELETE FROM cupones WHERE id = $1 RETURNING id`, [id]);
    return filas.length > 0;
  },

  /* ---------------- Configuración ---------------- */

  async getConfiguracion(): Promise<ConfiguracionTienda> {
    return obtenerConfig();
  },

  async guardarConfiguracion(datos): Promise<ConfiguracionTienda> {
    const actual = await obtenerConfig();
    const nueva = { ...actual, ...datos };
    await query(
      `INSERT INTO configuracion (clave, datos) VALUES ('tienda', $1)
         ON CONFLICT (clave) DO UPDATE SET datos = EXCLUDED.datos`,
      [nueva]
    );
    return nueva;
  },

  /* ---------------- Newsletter ---------------- */

  async suscribir(email): Promise<{ ok: boolean; error?: string }> {
    const normalizado = email.trim().toLowerCase();
    const fila = await queryUno<{ email: string }>(
      `INSERT INTO newsletter (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING email`,
      [normalizado]
    );
    if (!fila) return { ok: false, error: "Este correo ya está suscrito" };
    return { ok: true };
  },

  /* ---------------- Auditoría ---------------- */

  async registrarAuditoria(entrada): Promise<void> {
    await query(`INSERT INTO auditoria (fecha, actor, accion, detalle) VALUES ($1,$2,$3,$4)`, [
      ahora(),
      entrada.actor,
      entrada.accion,
      entrada.detalle,
    ]);
  },

  async getAuditoria(limite = 20) {
    const filas = await query<{ fecha: string; actor: string; accion: string; detalle: string }>(
      `SELECT fecha, actor, accion, detalle FROM auditoria
        ORDER BY fecha DESC, id DESC LIMIT $1`,
      [Math.max(1, Math.floor(limite))]
    );
    return filas.map((f) => ({ fecha: f.fecha, actor: f.actor, accion: f.accion, detalle: f.detalle }));
  },

  /* ---------------- Estadísticas ---------------- */

  async getEstadisticas(): Promise<EstadisticasDashboard> {
    // Los cortes de "hoy" y "mes" se calculan en hora de Perú (Lima),
    // no en la zona horaria del servidor.
    const NO_PAGADOS = `estado NOT IN ('cancelado','reembolsado')`;
    const INICIO_HOY = `(date_trunc('day', now() AT TIME ZONE 'America/Lima') AT TIME ZONE 'America/Lima')`;
    const INICIO_MES = `(date_trunc('month', now() AT TIME ZONE 'America/Lima') AT TIME ZONE 'America/Lima')`;

    const [totales, conteos, serie, top, actividad] = await Promise.all([
      query<{ total: number; n: number }>(
        `SELECT COALESCE(SUM(total), 0)::float8 AS total, COUNT(*)::int AS n
           FROM pedidos WHERE ${NO_PAGADOS}`
      ),
      query<{
        hoy: number;
        mes: number;
        pendientes: number;
        completados: number;
        pedidos: number;
        clientes: number;
        disponibles: number;
        agotados: number;
        bajos: number;
      }>(
        `SELECT
           (SELECT COALESCE(SUM(total), 0)::float8 FROM pedidos WHERE ${NO_PAGADOS} AND creado_en >= ${INICIO_HOY}) AS hoy,
           (SELECT COALESCE(SUM(total), 0)::float8 FROM pedidos WHERE ${NO_PAGADOS} AND creado_en >= ${INICIO_MES}) AS mes,
           (SELECT COUNT(*)::int FROM pedidos WHERE estado IN ('pendiente','pago_pendiente')) AS pendientes,
           (SELECT COUNT(*)::int FROM pedidos WHERE estado = 'entregado') AS completados,
           (SELECT COUNT(*)::int FROM pedidos) AS pedidos,
           (SELECT COUNT(*)::int FROM perfiles WHERE rol = 'customer') AS clientes,
           (SELECT COUNT(*)::int FROM productos WHERE activo AND stock > 0) AS disponibles,
           (SELECT COUNT(*)::int FROM productos WHERE activo AND stock = 0) AS agotados,
           (SELECT COUNT(*)::int FROM productos WHERE activo AND stock > 0 AND stock <= stock_minimo) AS bajos`
      ),
      query<{ fecha: string; total: number }>(
        `SELECT to_char(creado_en AT TIME ZONE 'America/Lima', 'YYYY-MM-DD') AS fecha,
                COALESCE(SUM(total), 0)::float8 AS total
           FROM pedidos
          WHERE ${NO_PAGADOS} AND creado_en >= now() - INTERVAL '30 days'
          GROUP BY 1 ORDER BY 1`
      ),
      query<{ nombre: string; slug: string; unidades: number; ingresos: number }>(
        `SELECT max(pi.nombre) AS nombre, max(pi.slug) AS slug,
                sum(pi.cantidad)::int AS unidades, sum(pi.subtotal)::float8 AS ingresos
           FROM pedido_items pi
           INNER JOIN pedidos p ON p.id = pi.pedido_id
          WHERE p.estado <> 'cancelado'
          GROUP BY pi.producto_id
          ORDER BY unidades DESC, ingresos DESC
          LIMIT 5`
      ),
      query<{ fecha: string; actor: string; accion: string; detalle: string }>(
        `SELECT fecha, actor, accion, detalle FROM auditoria
          ORDER BY fecha DESC, id DESC LIMIT 8`
      ),
    ]);

    const ventasTotales = Number(totales[0]?.total ?? 0);
    const nPedidosPagados = Number(totales[0]?.n ?? 0);

    // Serie de 30 días (días sin ventas incluidos con 0), en fecha de Lima
    const hoyLima = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
    const [a, m, d] = hoyLima.split("-").map(Number);
    const base = Date.UTC(a, m - 1, d);
    const mapaSerie = new Map(serie.map((f) => [f.fecha, Number(f.total)]));
    const serieVentas: { fecha: string; total: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const fecha = new Date(base - i * 86_400_000).toISOString().slice(0, 10);
      serieVentas.push({ fecha, total: mapaSerie.get(fecha) ?? 0 });
    }

    const c = conteos[0];

    return {
      ventasTotales,
      ventasHoy: Number(c?.hoy ?? 0),
      ventasMes: Number(c?.mes ?? 0),
      pedidosPendientes: Number(c?.pendientes ?? 0),
      pedidosCompletados: Number(c?.completados ?? 0),
      pedidosTotales: Number(c?.pedidos ?? 0),
      productosDisponibles: Number(c?.disponibles ?? 0),
      productosAgotados: Number(c?.agotados ?? 0),
      productosBajos: Number(c?.bajos ?? 0),
      clientes: Number(c?.clientes ?? 0),
      ticketPromedio: nPedidosPagados ? ventasTotales / nPedidosPagados : 0,
      topProductos: top.map((f) => ({
        nombre: f.nombre,
        slug: f.slug,
        unidades: Number(f.unidades),
        ingresos: Number(f.ingresos),
      })),
      serieVentas,
      actividadReciente: actividad.map((e) => ({
        fecha: e.fecha,
        texto: `${e.accion}: ${e.detalle}`,
        tipo: e.accion,
      })),
    };
  },
};
