import type {
  Categoria,
  ConfiguracionTienda,
  Cupon,
  Direccion,
  ItemCarrito,
  Marca,
  MetodoPago,
  MovimientoInventario,
  Pedido,
  Perfil,
  Producto,
  Resena,
  EstadoPedido,
} from "@/types";
import type {
  DataProvider,
  EstadisticasDashboard,
  FiltroProductos,
  ResultadoPaginado,
} from "@/lib/data/provider";
import { consultar, ahora, hashPassword, nuevoId, transaccion } from "./db";
import type { DBLocal, UsuarioLocal } from "./db";

/* ============================================================
   Implementación local del proveedor de datos.
   Persistencia JSON con operaciones atómicas.
   ============================================================ */

function aPerfil(u: UsuarioLocal): Perfil {
  return {
    id: u.id,
    email: u.email,
    nombre: u.nombre,
    apellidos: u.apellidos,
    telefono: u.telefono,
    rol: u.rol,
    activo: u.activo,
    creadoEn: u.creadoEn,
  };
}

function aplicarOrden(productos: Producto[], orden: FiltroProductos["orden"]): Producto[] {
  const copia = [...productos];
  switch (orden) {
    case "precio_asc":
      return copia.sort((a, b) => a.precio - b.precio);
    case "precio_desc":
      return copia.sort((a, b) => b.precio - a.precio);
    case "recientes":
      return copia.sort(
        (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
      );
    case "valorados":
      return copia.sort((a, b) => b.valoracion - a.valoracion);
    case "vendidos":
    default:
      return copia.sort((a, b) => b.vendidos - a.vendidos);
  }
}

function filtrar(db: DBLocal, filtro: FiltroProductos): Producto[] {
  const q = filtro.q?.trim().toLowerCase();
  return db.productos.filter((p) => {
    if (!filtro.incluirInactivos && !p.activo) return false;
    if (q) {
      const busqueda = `${p.nombre} ${p.nombreOriginal ?? ""} ${p.descripcion} ${p.etiquetas.join(
        " "
      )} ${p.marcaSlug}`.toLowerCase();
      if (!busqueda.includes(q)) return false;
    }
    if (filtro.categoria && p.categoriaSlug !== filtro.categoria) return false;
    if (filtro.pais && p.pais !== filtro.pais) return false;
    if (filtro.marca && p.marcaSlug !== filtro.marca) return false;
    if (filtro.soloOfertas && !(p.precioAnterior && p.precioAnterior > p.precio)) return false;
    if (filtro.soloDestacados && !p.destacado) return false;
    if (filtro.soloNuevos) {
      const dias = (Date.now() - new Date(p.creadoEn).getTime()) / 86_400_000;
      if (dias > 60) return false;
    }
    if (filtro.minPrecio != null && p.precio < filtro.minPrecio) return false;
    if (filtro.maxPrecio != null && p.precio > filtro.maxPrecio) return false;
    return true;
  });
}

function paginar<T>(items: T[], filtro: FiltroProductos): ResultadoPaginado<T> {
  const porPagina = Math.min(Math.max(filtro.porPagina ?? 12, 1), 60);
  const pagina = Math.max(filtro.pagina ?? 1, 1);
  const total = items.length;
  const paginas = Math.max(Math.ceil(total / porPagina), 1);
  const inicio = (pagina - 1) * porPagina;
  return { items: items.slice(inicio, inicio + porPagina), total, pagina, paginas };
}

export const proveedorLocal: DataProvider = {
  /* ---------------- Catálogo ---------------- */

  async getCategorias(): Promise<Categoria[]> {
    return consultar((db) => [...db.categorias].sort((a, b) => a.orden - b.orden));
  },

  async getMarcas(): Promise<Marca[]> {
    return consultar((db) => db.marcas);
  },

  async listarProductos(filtro): Promise<ResultadoPaginado<Producto>> {
    return consultar((db) => paginar(aplicarOrden(filtrar(db, filtro), filtro.orden), filtro));
  },

  async getProductoPorSlug(slug): Promise<Producto | null> {
    return consultar(
      (db) => db.productos.find((p) => p.slug === slug && p.activo) ?? null
    );
  },

  async getProductosRelacionados(slug, limite = 4): Promise<Producto[]> {
    return consultar((db) => {
      const actual = db.productos.find((p) => p.slug === slug);
      if (!actual) return [];
      const relacionados = db.productos.filter(
        (p) =>
          p.activo &&
          p.slug !== slug &&
          (p.categoriaSlug === actual.categoriaSlug || p.pais === actual.pais)
      );
      return aplicarOrden(relacionados, "valorados").slice(0, limite);
    });
  },

  async getSugerencias(q, limite = 6): Promise<Producto[]> {
    const texto = q.trim().toLowerCase();
    if (!texto) return [];
    return consultar((db) =>
      db.productos
        .filter(
          (p) =>
            p.activo &&
            `${p.nombre} ${p.nombreOriginal ?? ""} ${p.marcaSlug}`
              .toLowerCase()
              .includes(texto)
        )
        .slice(0, limite)
    );
  },

  async getProductosPorIds(ids: string[]): Promise<Producto[]> {
    if (ids.length === 0) return [];
    return consultar((db) => {
      const mapa = new Map(db.productos.map((p) => [p.id, p]));
      return ids.map((id) => mapa.get(id)).filter((p): p is Producto => !!p && p.activo);
    });
  },

  async getProductoPorId(id): Promise<Producto | null> {
    return consultar((db) => db.productos.find((p) => p.id === id) ?? null);
  },

  async getProductosDestacados(limite = 8): Promise<Producto[]> {
    return consultar((db) =>
      aplicarOrden(
        db.productos.filter((p) => p.activo && p.destacado),
        "vendidos"
      ).slice(0, limite)
    );
  },

  async getProductosNuevos(limite = 8): Promise<Producto[]> {
    return consultar((db) =>
      aplicarOrden(
        db.productos.filter((p) => p.activo),
        "recientes"
      ).slice(0, limite)
    );
  },

  async getMasVendidos(limite = 8): Promise<Producto[]> {
    return consultar((db) =>
      aplicarOrden(
        db.productos.filter((p) => p.activo),
        "vendidos"
      ).slice(0, limite)
    );
  },

  /* ---------------- Administración de productos ---------------- */

  async crearProducto(datos): Promise<Producto> {
    return transaccion((db) => {
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
      db.productos.push(producto);
      return producto;
    });
  },

  async actualizarProducto(id, datos): Promise<Producto | null> {
    return transaccion((db) => {
      const idx = db.productos.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      const actual = db.productos[idx];
      db.productos[idx] = {
        ...actual,
        ...datos,
        id: actual.id,
        slug: datos.slug ?? actual.slug,
        actualizadoEn: ahora(),
      };
      return db.productos[idx];
    });
  },

  async eliminarProducto(id): Promise<boolean> {
    return transaccion((db) => {
      const idx = db.productos.findIndex((p) => p.id === id);
      if (idx === -1) return false;
      // Baja lógica: conserva historial de pedidos y reseñas
      db.productos[idx] = { ...db.productos[idx], activo: false, actualizadoEn: ahora() };
      return true;
    });
  },

  async eliminarProductosDefinitivamente(ids): Promise<number> {
    const unicos = [...new Set(ids)];
    return transaccion((db) => {
      const existentes = db.productos.filter((p) => unicos.includes(p.id));
      if (existentes.length !== unicos.length) return 0;
      const borrados = new Set(unicos);
      db.productos = db.productos.filter((p) => !borrados.has(p.id));
      db.resenas = db.resenas.filter((r) => !borrados.has(r.productoId));
      db.movimientos = db.movimientos.filter((m) => !borrados.has(m.productoId));
      for (const usuarioId of Object.keys(db.carritos)) {
        db.carritos[usuarioId] = db.carritos[usuarioId].filter((i) => !borrados.has(i.productoId));
      }
      for (const usuarioId of Object.keys(db.favoritos)) {
        db.favoritos[usuarioId] = db.favoritos[usuarioId].filter((productoId) => !borrados.has(productoId));
      }
      // Los artículos de pedidos son snapshots y se conservan al borrar el producto.
      return unicos.length;
    });
  },

  async listarProductosAdmin(filtro = {}): Promise<ResultadoPaginado<Producto>> {
    return consultar((db) =>
      paginar(
        aplicarOrden(filtrar(db, { ...filtro, incluirInactivos: true }), filtro.orden),
        { porPagina: 60, ...filtro }
      )
    );
  },

  /* ---------------- Inventario ---------------- */

  async ajustarStock(productoId, delta, motivo, actor) {
    return transaccion((db) => {
      const producto = db.productos.find((p) => p.id === productoId);
      if (!producto) return { ok: false, error: "Producto no encontrado" };
      const nuevoStock = Math.max(0, producto.stock + delta);
      producto.stock = nuevoStock;
      producto.actualizadoEn = ahora();
      db.movimientos.unshift({
        id: nuevoId("mov"),
        productoId,
        productoNombre: producto.nombre,
        tipo: delta > 0 ? "entrada" : delta < 0 ? "salida" : "ajuste",
        cantidad: Math.abs(delta),
        stockResultante: nuevoStock,
        motivo,
        fecha: ahora(),
        autor: actor,
      });
      db.movimientos = db.movimientos.slice(0, 500);
      db.auditoria.unshift({
        fecha: ahora(),
        actor,
        accion: "inventario",
        detalle: `${producto.nombre}: ${delta > 0 ? "+" : ""}${delta} (${motivo})`,
      });
      return { ok: true, stock: nuevoStock };
    });
  },

  async getMovimientos(productoId): Promise<MovimientoInventario[]> {
    return consultar((db) =>
      db.movimientos.filter((m) => !productoId || m.productoId === productoId)
    );
  },

  /* ---------------- Usuarios ---------------- */

  async getPerfil(id): Promise<Perfil | null> {
    return consultar((db) => {
      const u = db.usuarios.find((x) => x.id === id);
      return u ? aPerfil(u) : null;
    });
  },

  async getPerfilPorEmail(email): Promise<Perfil | null> {
    const normalizado = email.trim().toLowerCase();
    return consultar((db) => {
      const u = db.usuarios.find((x) => x.email === normalizado);
      return u ? aPerfil(u) : null;
    });
  },

  async crearPerfil(datos): Promise<Perfil> {
    return transaccion((db) => {
      const existe = db.usuarios.some((u) => u.email === datos.email.toLowerCase());
      if (existe) throw new Error("El correo ya está registrado");
      const usuario: UsuarioLocal = {
        id: datos.id,
        email: datos.email.toLowerCase(),
        passwordHash: "",
        nombre: datos.nombre,
        apellidos: datos.apellidos,
        telefono: datos.telefono ?? null,
        rol: datos.rol ?? "customer",
        activo: true,
        creadoEn: ahora(),
      };
      db.usuarios.push(usuario);
      return aPerfil(usuario);
    });
  },

  async actualizarPerfil(id, datos): Promise<Perfil | null> {
    return transaccion((db) => {
      const u = db.usuarios.find((x) => x.id === id);
      if (!u) return null;
      // El rol NUNCA se modifica desde aquí (solo se actualizan campos de perfil)
      const campos = { ...datos };
      delete campos.rol;
      delete campos.activo;
      Object.assign(u, campos);
      return aPerfil(u);
    });
  },

  async listarUsuarios(q): Promise<Perfil[]> {
    return consultar((db) => {
      const texto = q?.trim().toLowerCase();
      return db.usuarios
        .filter(
          (u) =>
            !texto ||
            `${u.nombre} ${u.apellidos} ${u.email}`.toLowerCase().includes(texto)
        )
        .map(aPerfil)
        .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    });
  },

  async cambiarEstadoUsuario(id, activo): Promise<boolean> {
    return transaccion((db) => {
      const u = db.usuarios.find((x) => x.id === id);
      if (!u) return false;
      u.activo = activo;
      return true;
    });
  },

  async anonimizarClientes(ids): Promise<"ok" | "no_encontrado" | "no_cliente" | "pedido_activo"> {
    const unicos = [...new Set(ids)];
    return transaccion((db) => {
      const usuarios = db.usuarios.filter((u) => unicos.includes(u.id));
      if (usuarios.length !== unicos.length) return "no_encontrado";
      if (usuarios.some((u) => u.rol !== "customer")) return "no_cliente";
      const terminales = new Set(["entregado", "cancelado", "reembolsado"]);
      if (db.pedidos.some((p) => unicos.includes(p.usuarioId) && !terminales.has(p.estado)))
        return "pedido_activo";

      for (const usuario of usuarios) {
        const correoOriginal = usuario.email;
        const idSeguro = usuario.id.replace(/[^a-zA-Z0-9-]/g, "") || "cuenta";
        usuario.email = `eliminado-${idSeguro}@cuenta.eliminada.invalid`;
        usuario.nombre = "Cuenta eliminada";
        usuario.apellidos = "";
        usuario.telefono = null;
        usuario.activo = false;
        usuario.passwordHash = "";
        usuario.resetToken = null;
        usuario.resetExpires = null;

        db.direcciones = db.direcciones.filter((d) => d.usuarioId !== usuario.id);
        delete db.carritos[usuario.id];
        delete db.favoritos[usuario.id];
        db.suscriptores = db.suscriptores.filter((s) => s.email.toLowerCase() !== correoOriginal.toLowerCase());
        for (const pedido of db.pedidos.filter((p) => p.usuarioId === usuario.id)) {
          pedido.direccion = {
            nombreCompleto: "Cuenta eliminada",
            telefono: "",
            departamento: "",
            provincia: "",
            distrito: "",
            direccion: "",
            referencia: null,
            indicaciones: null,
          };
          pedido.notas = null;
          pedido.historial = pedido.historial.map(({ estado, fecha }) => ({ estado, fecha }));
        }
        for (const resena of db.resenas.filter((r) => r.usuarioId === usuario.id)) {
          resena.usuarioNombre = "Cliente";
        }
      }
      return "ok";
    });
  },

  async solicitarReset(email, token, expira): Promise<boolean> {
    return transaccion((db) => {
      const u = db.usuarios.find((x) => x.email === email.toLowerCase());
      if (!u) return false;
      u.resetToken = token;
      u.resetExpires = expira;
      return true;
    });
  },

  async restablecerConToken(token, passwordHash): Promise<boolean> {
    return transaccion((db) => {
      const u = db.usuarios.find(
        (x) => x.resetToken === token && x.resetExpires && new Date(x.resetExpires) > new Date()
      );
      if (!u) return false;
      u.passwordHash = passwordHash;
      u.resetToken = null;
      u.resetExpires = null;
      return true;
    });
  },

  async guardarPasswordHash(usuarioId, hash): Promise<void> {
    await transaccion((db) => {
      const u = db.usuarios.find((x) => x.id === usuarioId);
      if (u) u.passwordHash = hash;
    });
  },

  async getPasswordHash(usuarioId): Promise<string | null> {
    return consultar(
      (db) => db.usuarios.find((x) => x.id === usuarioId)?.passwordHash ?? null
    );
  },

  async guardarPasswordHashPorEmail(email, hash): Promise<void> {
    await transaccion((db) => {
      const u = db.usuarios.find((x) => x.email === email.toLowerCase());
      if (u) u.passwordHash = hash;
    });
  },

  /* ---------------- Carrito ---------------- */

  async getCarrito(usuarioId): Promise<ItemCarrito[]> {
    return consultar((db) => db.carritos[usuarioId] ?? []);
  },

  async guardarCarrito(usuarioId, items): Promise<ItemCarrito[]> {
    return transaccion((db) => {
      db.carritos[usuarioId] = items;
      return items;
    });
  },

  async limpiarCarrito(usuarioId): Promise<void> {
    await transaccion((db) => {
      delete db.carritos[usuarioId];
    });
  },

  /* ---------------- Favoritos ---------------- */

  async getFavoritos(usuarioId): Promise<string[]> {
    return consultar((db) => db.favoritos[usuarioId] ?? []);
  },

  async alternarFavorito(usuarioId, productoId): Promise<string[]> {
    return transaccion((db) => {
      const lista = db.favoritos[usuarioId] ?? [];
      const i = lista.indexOf(productoId);
      if (i === -1) lista.push(productoId);
      else lista.splice(i, 1);
      db.favoritos[usuarioId] = lista;
      return lista;
    });
  },

  /* ---------------- Direcciones ---------------- */

  async getDirecciones(usuarioId): Promise<Direccion[]> {
    return consultar((db) =>
      db.direcciones
        .filter((d) => d.usuarioId === usuarioId)
        .sort((a, b) => Number(b.porDefecto) - Number(a.porDefecto))
    );
  },

  async crearDireccion(datos): Promise<Direccion> {
    return transaccion((db) => {
      if (datos.porDefecto) {
        db.direcciones.forEach((d) => {
          if (d.usuarioId === datos.usuarioId) d.porDefecto = false;
        });
      }
      const direccion: Direccion = { ...datos, id: nuevoId("dir") };
      db.direcciones.push(direccion);
      return direccion;
    });
  },

  async actualizarDireccion(id, datos): Promise<Direccion | null> {
    return transaccion((db) => {
      const idx = db.direcciones.findIndex((d) => d.id === id);
      if (idx === -1) return null;
      if (datos.porDefecto) {
        const usuarioId = db.direcciones[idx].usuarioId;
        db.direcciones.forEach((d) => {
          if (d.usuarioId === usuarioId) d.porDefecto = false;
        });
      }
      db.direcciones[idx] = { ...db.direcciones[idx], ...datos, id };
      return db.direcciones[idx];
    });
  },

  async eliminarDireccion(id): Promise<boolean> {
    return transaccion((db) => {
      const idx = db.direcciones.findIndex((d) => d.id === id);
      if (idx === -1) return false;
      db.direcciones.splice(idx, 1);
      return true;
    });
  },

  /* ---------------- Pedidos ---------------- */

  async crearPedido(datos): Promise<{ ok: boolean; pedido?: Pedido; error?: string }> {
    return transaccion((db) => {
      // 1) Validar items contra la BD (nunca confiar en precios del cliente)
      const items: Pedido["items"] = [];
      let subtotal = 0;
      for (const item of datos.items) {
        const producto = db.productos.find((p) => p.id === item.productoId);
        if (!producto || !producto.activo) {
          return { ok: false, error: "Un producto ya no está disponible" };
        }
        const cantidad = Math.max(1, Math.floor(item.cantidad));
        if (producto.stock < cantidad) {
          return {
            ok: false,
            error: `Solo quedan ${producto.stock} unidades de ${producto.nombre}`,
          };
        }
        const linea = producto.precio * cantidad;
        subtotal += linea;
        items.push({
          productoId: producto.id,
          slug: producto.slug,
          nombre: producto.nombre,
          imagen: producto.imagenes[0] ?? "/logo.png",
          cantidad,
          precioUnitario: producto.precio,
          subtotal: linea,
        });
      }
      if (items.length === 0) return { ok: false, error: "El carrito está vacío" };

      // 2) Cupón
      let descuento = 0;
      let cupon: Cupon | null = null;
      if (datos.cuponCodigo) {
        const codigo = datos.cuponCodigo.trim().toUpperCase();
        cupon =
          db.cupones.find(
            (c) => c.codigo === codigo && c.activo
          ) ?? null;
        if (!cupon) return { ok: false, error: "El cupón no existe o no está activo" };
        const hoy = Date.now();
        if (cupon.fechaInicio && new Date(cupon.fechaInicio).getTime() > hoy)
          return { ok: false, error: "El cupón aún no está vigente" };
        if (cupon.fechaFin && new Date(cupon.fechaFin).getTime() < hoy)
          return { ok: false, error: "El cupón expiró" };
        if (cupon.usosMaximos != null && cupon.usosActuales >= cupon.usosMaximos)
          return { ok: false, error: "El cupón alcanzó su límite de usos" };
        if (cupon.compraMinima != null && subtotal < cupon.compraMinima)
          return {
            ok: false,
            error: `Este cupón requiere un mínimo de S/ ${cupon.compraMinima.toFixed(2)}`,
          };
        descuento =
          cupon.tipo === "porcentaje"
            ? Math.round(subtotal * (cupon.valor / 100) * 100) / 100
            : Math.min(cupon.valor, subtotal);
      }

      // 3) Envío recalculado en el servidor según configuración
      const cfg = db.configuracion;
      const envioGratis = subtotal - descuento >= cfg.envioGratisDesde;
      let envio = 0;
      if (datos.metodoEnvio === "delivery_local") envio = cfg.envioCostoLocal;
      if (datos.metodoEnvio === "recojo_tienda") envio = 0;
      if (envioGratis && datos.metodoEnvio !== "recojo_tienda") envio = 0;

      const total = Math.max(0, subtotal - descuento + envio);

      // 4) Descuento de stock atómico (dentro de la transacción serializada)
      for (const item of datos.items) {
        const producto = db.productos.find((p) => p.id === item.productoId)!;
        producto.stock -= Math.max(1, Math.floor(item.cantidad));
        producto.vendidos += Math.max(1, Math.floor(item.cantidad));
        producto.actualizadoEn = ahora();
        db.movimientos.unshift({
          id: nuevoId("mov"),
          productoId: producto.id,
          productoNombre: producto.nombre,
          tipo: "venta",
          cantidad: Math.max(1, Math.floor(item.cantidad)),
          stockResultante: producto.stock,
          motivo: "Venta en pedido",
          fecha: ahora(),
          autor: "sistema",
        });
      }

      // 5) Número único de pedido
      db.contadorPedidos += 1;
      const anio = new Date().getFullYear();
      const numero = `ITD-${anio}-${String(db.contadorPedidos).padStart(5, "0")}`;

      const estado: EstadoPedido =
        datos.metodoPago === "contra_entrega" ? "pendiente" : "pago_pendiente";

      const pedido: Pedido = {
        id: nuevoId("ped"),
        numero,
        usuarioId: datos.usuarioId,
        estado,
        metodoPago: datos.metodoPago,
        metodoEnvio: datos.metodoEnvio,
        items,
        subtotal,
        descuento,
        cuponCodigo: cupon?.codigo ?? null,
        envio,
        total,
        direccion: datos.direccion,
        notas: datos.notas ?? null,
        creadoEn: ahora(),
        actualizadoEn: ahora(),
        historial: [{ estado, fecha: ahora(), nota: "Pedido creado" }],
      };
      db.pedidos.unshift(pedido);

      // 6) Uso de cupón
      if (cupon) {
        cupon.usosActuales += 1;
        db.usosCupon.push({
          id: nuevoId("uso"),
          cuponId: cupon.id,
          codigo: cupon.codigo,
          usuarioId: datos.usuarioId,
          pedidoId: pedido.id,
          fecha: ahora(),
        });
      }

      // 7) Limpiar carrito del usuario
      delete db.carritos[datos.usuarioId];

      // 8) Auditoría
      db.auditoria.unshift({
        fecha: ahora(),
        actor: datos.usuarioId,
        accion: "pedido",
        detalle: `Pedido ${numero} por S/ ${total.toFixed(2)}`,
      });

      return { ok: true, pedido };
    });
  },

  async getPedidoPorNumero(numero): Promise<Pedido | null> {
    return consultar((db) => db.pedidos.find((p) => p.numero === numero) ?? null);
  },

  async getPedido(id): Promise<Pedido | null> {
    return consultar((db) => db.pedidos.find((p) => p.id === id) ?? null);
  },

  async listarPedidosUsuario(usuarioId): Promise<Pedido[]> {
    return consultar((db) =>
      db.pedidos
        .filter((p) => p.usuarioId === usuarioId)
        .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
    );
  },

  async listarPedidosAdmin(filtro = {}): Promise<Pedido[]> {
    return consultar((db) => {
      const q = filtro.q?.trim().toLowerCase();
      return db.pedidos
        .filter((p) => {
          if (filtro.estado && p.estado !== filtro.estado) return false;
          if (!q) return true;
          return `${p.numero} ${p.direccion.nombreCompleto} ${p.direccion.telefono}`
            .toLowerCase()
            .includes(q);
        })
        .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    });
  },

  async actualizarEstadoPedido(id, estado, nota, actor = "admin") {
    return transaccion((db) => {
      const pedido = db.pedidos.find((p) => p.id === id);
      if (!pedido) return null;
      pedido.estado = estado;
      pedido.actualizadoEn = ahora();
      pedido.historial.push({ estado, fecha: ahora(), nota: nota ?? undefined });
      db.auditoria.unshift({
        fecha: ahora(),
        actor,
        accion: "pedido",
        detalle: `${pedido.numero} → ${estado}${nota ? ` (${nota})` : ""}`,
      });
      return pedido;
    });
  },

  async confirmarPagoManual(id, metodo: MetodoPago, actor = "admin") {
    return transaccion((db) => {
      const pedido = db.pedidos.find((p) => p.id === id);
      if (!pedido) return null;
      pedido.metodoPago = metodo;
      pedido.estado = "pago_confirmado";
      pedido.actualizadoEn = ahora();
      pedido.historial.push({
        estado: "pago_confirmado",
        fecha: ahora(),
        nota: `Pago verificado por ${actor}`,
      });
      db.auditoria.unshift({
        fecha: ahora(),
        actor,
        accion: "pago",
        detalle: `Pago confirmado en ${pedido.numero} (${metodo})`,
      });
      return pedido;
    });
  },

  /* ---------------- Reseñas ---------------- */

  async getResenas(productoId): Promise<Resena[]> {
    return consultar((db) =>
      db.resenas
        .filter((r) => r.productoId === productoId)
        .sort((a, b) => b.creadaEn.localeCompare(a.creadaEn))
    );
  },

  async crearResena(resena): Promise<Resena> {
    return transaccion((db) => {
      const nueva: Resena = {
        ...resena,
        id: nuevoId("res"),
        creadaEn: ahora(),
      };
      db.resenas.unshift(nueva);
      // Recalcular valoración del producto
      const producto = db.productos.find((p) => p.id === resena.productoId);
      if (producto) {
        const propias = db.resenas.filter((r) => r.productoId === resena.productoId);
        producto.valoracion =
          Math.round(
            (propias.reduce((s, r) => s + r.calificacion, 0) / propias.length) * 10
          ) / 10;
        producto.numValoraciones = propias.length;
      }
      return nueva;
    });
  },

  async getResenasUsuario(usuarioId): Promise<Resena[]> {
    return consultar((db) =>
      db.resenas.filter((r) => r.usuarioId === usuarioId)
    );
  },

  /* ---------------- Cupones ---------------- */

  async getCupones(): Promise<Cupon[]> {
    return consultar((db) => db.cupones);
  },

  async validarCupon(codigo, subtotal) {
    return consultar((db) => {
      const cupon = db.cupones.find(
        (c) => c.codigo.toUpperCase() === codigo.trim().toUpperCase()
      );
      if (!cupon) return { ok: false, error: "Cupón no encontrado" };
      if (!cupon.activo) return { ok: false, error: "Cupón desactivado" };
      const hoy = Date.now();
      if (cupon.fechaInicio && new Date(cupon.fechaInicio).getTime() > hoy)
        return { ok: false, error: "El cupón aún no está vigente" };
      if (cupon.fechaFin && new Date(cupon.fechaFin).getTime() < hoy)
        return { ok: false, error: "El cupón expiró" };
      if (cupon.usosMaximos != null && cupon.usosActuales >= cupon.usosMaximos)
        return { ok: false, error: "Cupón agotado" };
      if (cupon.compraMinima != null && subtotal < cupon.compraMinima)
        return {
          ok: false,
          error: `Compra mínima de S/ ${cupon.compraMinima.toFixed(2)}`,
        };
      return { ok: true, cupon };
    });
  },

  async crearCupon(cupon): Promise<Cupon> {
    return transaccion((db) => {
      const nuevo: Cupon = { ...cupon, id: nuevoId("cup"), usosActuales: 0 };
      db.cupones.push(nuevo);
      return nuevo;
    });
  },

  async actualizarCupon(id, datos): Promise<Cupon | null> {
    return transaccion((db) => {
      const idx = db.cupones.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      db.cupones[idx] = { ...db.cupones[idx], ...datos, id };
      return db.cupones[idx];
    });
  },

  async eliminarCupon(id): Promise<boolean> {
    return transaccion((db) => {
      const idx = db.cupones.findIndex((c) => c.id === id);
      if (idx === -1) return false;
      db.cupones.splice(idx, 1);
      return true;
    });
  },

  /* ---------------- Configuración ---------------- */

  async getConfiguracion(): Promise<ConfiguracionTienda> {
    return consultar((db) => db.configuracion);
  },

  async guardarConfiguracion(datos): Promise<ConfiguracionTienda> {
    return transaccion((db) => {
      db.configuracion = { ...db.configuracion, ...datos };
      return db.configuracion;
    });
  },

  /* ---------------- Newsletter ---------------- */

  async suscribir(email): Promise<{ ok: boolean; error?: string }> {
    return transaccion((db) => {
      const normalizado = email.trim().toLowerCase();
      if (db.suscriptores.some((s) => s.email === normalizado))
        return { ok: false, error: "Este correo ya está suscrito" };
      db.suscriptores.push({ email: normalizado, fecha: ahora() });
      return { ok: true };
    });
  },

  /* ---------------- Auditoría ---------------- */

  async registrarAuditoria(entrada): Promise<void> {
    await transaccion((db) => {
      db.auditoria.unshift({ fecha: ahora(), ...entrada });
      db.auditoria = db.auditoria.slice(0, 300);
    });
  },

  async getAuditoria(limite = 20) {
    return consultar((db) => db.auditoria.slice(0, limite));
  },

  /* ---------------- Estadísticas ---------------- */

  async getEstadisticas(): Promise<EstadisticasDashboard> {
    return consultar((db) => {
      const pagados = db.pedidos.filter(
        (p) => p.estado !== "cancelado" && p.estado !== "reembolsado"
      );
      const inicioHoy = new Date();
      inicioHoy.setHours(0, 0, 0, 0);
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const ventasTotales = pagados.reduce((s, p) => s + p.total, 0);
      const ventasHoy = pagados
        .filter((p) => new Date(p.creadoEn) >= inicioHoy)
        .reduce((s, p) => s + p.total, 0);
      const ventasMes = pagados
        .filter((p) => new Date(p.creadoEn) >= inicioMes)
        .reduce((s, p) => s + p.total, 0);

      // Serie de 30 días
      const serie: { fecha: string; total: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const fin = new Date(d);
        fin.setDate(fin.getDate() + 1);
        const total = pagados
          .filter((p) => {
            const f = new Date(p.creadoEn);
            return f >= d && f < fin;
          })
          .reduce((s, p) => s + p.total, 0);
        serie.push({ fecha: d.toISOString().slice(0, 10), total });
      }

      // Top productos (de los pedidos)
      const mapa = new Map<string, { nombre: string; slug: string; unidades: number; ingresos: number }>();
      db.pedidos.forEach((pedido) => {
        if (pedido.estado === "cancelado") return;
        pedido.items.forEach((item) => {
          const actual = mapa.get(item.productoId) ?? {
            nombre: item.nombre,
            slug: item.slug,
            unidades: 0,
            ingresos: 0,
          };
          actual.unidades += item.cantidad;
          actual.ingresos += item.subtotal;
          mapa.set(item.productoId, actual);
        });
      });
      const topProductos = [...mapa.values()]
        .sort((a, b) => b.unidades - a.unidades)
        .slice(0, 5);

      const clientes = db.usuarios.filter((u) => u.rol === "customer").length;
      const pedidosCompletados = db.pedidos.filter(
        (p) => p.estado === "entregado"
      ).length;

      return {
        ventasTotales,
        ventasHoy,
        ventasMes,
        pedidosPendientes: db.pedidos.filter(
          (p) => p.estado === "pendiente" || p.estado === "pago_pendiente"
        ).length,
        pedidosCompletados,
        pedidosTotales: db.pedidos.length,
        productosDisponibles: db.productos.filter((p) => p.activo && p.stock > 0).length,
        productosAgotados: db.productos.filter((p) => p.activo && p.stock === 0).length,
        productosBajos: db.productos.filter(
          (p) => p.activo && p.stock > 0 && p.stock <= p.stockMinimo
        ).length,
        clientes,
        ticketPromedio: pagados.length ? ventasTotales / pagados.length : 0,
        topProductos,
        serieVentas: serie,
        actividadReciente: db.auditoria.slice(0, 8).map((e) => ({
          fecha: e.fecha,
          texto: `${e.accion}: ${e.detalle}`,
          tipo: e.accion,
        })),
      };
    });
  },
};

export { hashPassword };
