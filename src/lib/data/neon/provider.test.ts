import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import type { DataProvider } from "@/lib/data/provider";
import type { Direccion, ItemCarrito, Pedido, Producto } from "@/types";

/* ============================================================
   Tests de integración del proveedor PostgreSQL (Neon).
   Se ejecutan contra un Postgres real en memoria (PGlite)
   escuchando por TCP, usando el mismo driver `pg` y las mismas
   migraciones que se aplicarán en Neon. Sin servicios externos.
   ============================================================ */

const PUERTO = Number(process.env.PGLITE_PUERTO_TEST ?? 55433);

let db!: PGlite;
let servidor!: PGLiteSocketServer;
let proveedor!: DataProvider;

beforeAll(async () => {
  // 1) Postgres en memoria con el esquema y el seed reales
  db = new PGlite();
  const dir = path.join(process.cwd(), "db", "migrations");
  const archivos = readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".sql"))
    .sort();
  for (const archivo of archivos) {
    await db.exec(readFileSync(path.join(dir, archivo), "utf8"));
  }

  // 2) Expuesto por TCP para que el pool `pg` se conecte igual que a Neon
  servidor = new PGLiteSocketServer({ db, port: PUERTO, maxConnections: 10 });
  await servidor.start();

  // 3) El provider lee la URL al crear el pool (lazy) → antes de la 1ª consulta
  process.env.NEON_DATABASE_URL = `postgresql://postgres@127.0.0.1:${PUERTO}/postgres`;
  ({ proveedorNeon: proveedor } = await import("./provider"));
}, 120_000);

afterAll(async () => {
  const { cerrarPool } = await import("./db");
  await cerrarPool();
  await servidor?.stop();
  await db?.close();
}, 30_000);

/* ---------------- Catálogo ---------------- */

describe("catálogo", () => {
  it("lista categorías y marcas del seed", async () => {
    const cats = await proveedor.getCategorias();
    expect(cats).toHaveLength(7);
    expect(cats[0].slug).toBe("buldak"); // orden 1

    const marcas = await proveedor.getMarcas();
    expect(marcas).toHaveLength(16);
    expect(marcas.some((m) => m.pais === "corea")).toBe(true);
    expect(marcas.some((m) => m.pais === "japon")).toBe(true);
  });

  it("pagina el catálogo (28 productos, 3 páginas de 10)", async () => {
    const p1 = await proveedor.listarProductos({ porPagina: 10 });
    expect(p1.total).toBe(28);
    expect(p1.items).toHaveLength(10);
    expect(p1.paginas).toBe(3);
    expect(p1.pagina).toBe(1);

    const p2 = await proveedor.listarProductos({ porPagina: 10, pagina: 2 });
    expect(p2.items).toHaveLength(10);
    expect(p2.items[0].id).not.toBe(p1.items[0].id);

    const p3 = await proveedor.listarProductos({ porPagina: 10, pagina: 3 });
    expect(p3.items).toHaveLength(8);

    const lejos = await proveedor.listarProductos({ porPagina: 10, pagina: 99 });
    expect(lejos.items).toHaveLength(0);
    expect(lejos.total).toBe(28);
  });

  it("filtra por categoría, país y búsqueda", async () => {
    const cat = await proveedor.listarProductos({ categoria: "buldak", porPagina: 60 });
    expect(cat.total).toBeGreaterThan(0);
    expect(cat.items.every((p) => p.categoriaSlug === "buldak")).toBe(true);

    const pais = await proveedor.listarProductos({ pais: "corea", porPagina: 60 });
    expect(pais.total).toBeGreaterThan(0);
    expect(pais.items.every((p) => p.pais === "corea")).toBe(true);

    const q = await proveedor.listarProductos({ q: "buldak", porPagina: 60 });
    expect(q.total).toBeGreaterThan(0);

    const marca = await proveedor.listarProductos({ marca: "samyang", porPagina: 60 });
    expect(marca.total).toBeGreaterThan(0);
    expect(marca.items.every((p) => p.marcaSlug === "samyang")).toBe(true);
  });

  it("filtra ofertas, rango de precios y ordena", async () => {
    const ofertas = await proveedor.listarProductos({ soloOfertas: true, porPagina: 60 });
    expect(ofertas.total).toBeGreaterThan(0);
    expect(ofertas.total).toBeLessThanOrEqual(10);
    expect(
      ofertas.items.every((p) => p.precioAnterior != null && p.precioAnterior > p.precio)
    ).toBe(true);

    const rango = await proveedor.listarProductos({ minPrecio: 10, maxPrecio: 20, porPagina: 60 });
    expect(rango.items.every((p) => p.precio >= 10 && p.precio <= 20)).toBe(true);

    const asc = await proveedor.listarProductos({ orden: "precio_asc", porPagina: 60 });
    const precios = asc.items.map((p) => p.precio);
    expect(precios).toEqual([...precios].sort((a, b) => a - b));

    const desc = await proveedor.listarProductos({ orden: "precio_desc", porPagina: 60 });
    const bajos = desc.items.map((p) => p.precio);
    expect(bajos[0]).toBeGreaterThanOrEqual(bajos[bajos.length - 1]);
  });

  it("recupera por slug, destacados, nuevos y más vendidos", async () => {
    const p = await proveedor.getProductoPorSlug("buldak-original");
    expect(p).not.toBeNull();
    expect(p!.nombre).toContain("Buldak");
    expect(p!.precio).toBe(12.9);
    expect(p!.nombreOriginal).toBe("불닭볶음면");
    expect(await proveedor.getProductoPorSlug("no-existe")).toBeNull();

    const dest = await proveedor.getProductosDestacados();
    expect(dest.length).toBeGreaterThan(0);
    expect(dest.every((x) => x.destacado && x.activo)).toBe(true);

    expect((await proveedor.getProductosNuevos(5)).length).toBe(5);
    expect((await proveedor.getMasVendidos(5)).length).toBe(5);
  });

  it("sugerencias, relacionados e ids respetan el orden", async () => {
    const sug = await proveedor.getSugerencias("ramen");
    expect(sug.length).toBeGreaterThan(0);
    expect(await proveedor.getSugerencias("   ")).toHaveLength(0);

    const rel = await proveedor.getProductosRelacionados("buldak-original");
    expect(rel.length).toBeGreaterThan(0);
    expect(rel.length).toBeLessThanOrEqual(4);
    expect(rel.every((p) => p.slug !== "buldak-original")).toBe(true);

    const primeros = (await proveedor.listarProductos({ porPagina: 2 })).items;
    const ids = primeros.map((p) => p.id);
    const invertidos = await proveedor.getProductosPorIds([ids[1], ids[0]]);
    expect(invertidos.map((p) => p.id)).toEqual([ids[1], ids[0]]);
    expect(await proveedor.getProductosPorIds([])).toHaveLength(0);

    expect(await proveedor.getProductoPorId(ids[0])).not.toBeNull();
    expect(await proveedor.getProductoPorId("prod-fantasma")).toBeNull();
  });
});

/* ---------------- Administración de productos ---------------- */

describe("administración de productos", () => {
  let creado!: Producto;

  it("crea un producto con los valores por defecto", async () => {
    creado = await proveedor.crearProducto({
      slug: "test-producto-admin",
      nombre: "Producto de prueba",
      precio: 19.9,
      stock: 7,
    });
    expect(creado.id).toMatch(/^prod-/);
    expect(creado.activo).toBe(true);
    expect(creado.categoriaSlug).toBe("snacks"); // por defecto
    expect(creado.marcaSlug).toBe("itadakimasu"); // por defecto (FK válida)
    expect(creado.vendidos).toBe(0);

    const porSlug = await proveedor.getProductoPorSlug("test-producto-admin");
    expect(porSlug?.id).toBe(creado.id);
  });

  it("actualiza campos y devuelve null si no existe", async () => {
    const r = await proveedor.actualizarProducto(creado.id, { precio: 25, destacado: true });
    expect(r?.precio).toBe(25);
    expect(r?.destacado).toBe(true);
    expect(r!.actualizadoEn).toBeTruthy();

    expect(await proveedor.actualizarProducto("prod-fantasma", { precio: 1 })).toBeNull();
    const sinCambios = await proveedor.actualizarProducto(creado.id, {});
    expect(sinCambios?.id).toBe(creado.id);
  });

  it("desactiva sin borrar el registro (soft delete)", async () => {
    expect(await proveedor.eliminarProducto(creado.id)).toBe(true);

    expect(await proveedor.getProductoPorSlug("test-producto-admin")).toBeNull();
    const admin = await proveedor.getProductoPorId(creado.id);
    expect(admin?.activo).toBe(false);
    expect(await proveedor.eliminarProducto("prod-fantasma")).toBe(false);

    const listado = await proveedor.listarProductosAdmin({ q: "Producto de prueba" });
    expect(listado.total).toBe(1); // sigue visible para el admin
    const publico = await proveedor.listarProductos({ q: "Producto de prueba" });
    expect(publico.total).toBe(0); // pero no para la tienda
  });
});

/* ---------------- Inventario ---------------- */

describe("inventario", () => {
  it("ajusta stock con registro de movimiento y sin negativos", async () => {
    const antes = (await proveedor.getProductoPorId("prod-001"))!.stock; // 21
    expect(antes).toBe(21);

    const subida = await proveedor.ajustarStock("prod-001", 5, "Reposición de prueba", "test");
    expect(subida.ok).toBe(true);
    expect(subida.stock).toBe(antes + 5);

    const bajada = await proveedor.ajustarStock("prod-001", -1000, "Merma de prueba", "test");
    expect(bajada.ok).toBe(true);
    expect(bajada.stock).toBe(0); // nunca negativo

    const movs = await proveedor.getMovimientos("prod-001");
    expect(movs.length).toBeGreaterThanOrEqual(2);
    expect(movs[0].stockResultante).toBe(0); // el más reciente primero
    expect(movs.some((m) => m.tipo === "entrada")).toBe(true);
    expect(movs.some((m) => m.tipo === "salida")).toBe(true);
    expect(movs.every((m) => m.autor === "test")).toBe(true);

    const todos = await proveedor.getMovimientos();
    expect(todos.length).toBeGreaterThanOrEqual(movs.length);

    const fallo = await proveedor.ajustarStock("prod-fantasma", 1, "x", "test");
    expect(fallo.ok).toBe(false);
    expect(fallo.error).toMatch(/no encontrado/i);
  });
});

/* ---------------- Perfiles ---------------- */

describe("perfiles", () => {
  const id = "usr-test-001";
  const email = "dave.test@correo.com";

  it("crea un perfil y lo recupera por email sin importar mayúsculas", async () => {
    const p = await proveedor.crearPerfil({
      id,
      email,
      nombre: "Dave",
      apellidos: "Cliente",
      telefono: "999888777",
    });
    expect(p.rol).toBe("customer");
    expect(p.activo).toBe(true);

    expect((await proveedor.getPerfilPorEmail("DAVE.TEST@CORREO.COM"))?.id).toBe(id);
    expect(await proveedor.getPerfil(id)).not.toBeNull();
    expect(await proveedor.getPerfil("usr-fantasma")).toBeNull();
  });

  it("rechaza correos duplicados", async () => {
    await expect(
      proveedor.crearPerfil({ id: "usr-test-002", email, nombre: "X", apellidos: "Y" })
    ).rejects.toThrow("El correo ya está registrado");
  });

  it("actualiza el perfil pero ignora rol y activo", async () => {
    const r = await proveedor.actualizarPerfil(id, {
      nombre: "David",
      apellidos: "Prueba",
      rol: "admin",
      activo: false,
    });
    expect(r?.nombre).toBe("David");
    expect(r?.rol).toBe("customer"); // el rol solo se cambia con acciones admin
    expect(r?.activo).toBe(true);

    const sinCambios = await proveedor.actualizarPerfil(id, {});
    expect(sinCambios?.id).toBe(id);
    expect(await proveedor.actualizarPerfil("usr-fantasma", { nombre: "N" })).toBeNull();
  });

  it("lista, busca y cambia el estado de usuarios", async () => {
    const todos = await proveedor.listarUsuarios();
    expect(todos.length).toBeGreaterThanOrEqual(2); // admin + Dave

    const buscados = await proveedor.listarUsuarios("david");
    expect(buscados.some((u) => u.id === id)).toBe(true);
    expect(await proveedor.listarUsuarios("zzz-no-existe")).toHaveLength(0);

    expect(await proveedor.cambiarEstadoUsuario(id, false)).toBe(true);
    expect((await proveedor.getPerfil(id))?.activo).toBe(false);
    expect(await proveedor.cambiarEstadoUsuario("usr-fantasma", false)).toBe(false);
    await proveedor.cambiarEstadoUsuario(id, true); // se reactiva para el resto
  });

  it("gestiona la recuperación de contraseña por token", async () => {
    expect(
      await proveedor.solicitarReset(email, "token-vigente", new Date(Date.now() + 600_000).toISOString())
    ).toBe(true);
    expect(await proveedor.solicitarReset("nadie@correo.com", "t", new Date().toISOString())).toBe(
      false
    );
    expect(await proveedor.restablecerConToken("token-malo", "hash")).toBe(false);

    // token vencido → no sirve
    await proveedor.solicitarReset(email, "token-vencido", new Date(Date.now() - 1_000).toISOString());
    expect(await proveedor.restablecerConToken("token-vencido", "hash")).toBe(false);

    // token vigente → cambia la contraseña y queda usado
    await proveedor.solicitarReset(email, "token-ok", new Date(Date.now() + 600_000).toISOString());
    expect(await proveedor.restablecerConToken("token-ok", "hash-nuevo")).toBe(true);
    expect(await proveedor.getPasswordHash(id)).toBe("hash-nuevo");
    expect(await proveedor.restablecerConToken("token-ok", "otro")).toBe(false);

    await proveedor.guardarPasswordHashPorEmail(email, "hash-por-email");
    expect(await proveedor.getPasswordHash(id)).toBe("hash-por-email");
    await proveedor.guardarPasswordHash(id, "hash-final");
    expect(await proveedor.getPasswordHash(id)).toBe("hash-final");
    expect(await proveedor.getPasswordHash("usr-fantasma")).toBeNull();
  });
});

/* ---------------- Carrito y favoritos ---------------- */

describe("carrito y favoritos", () => {
  const id = "usr-test-001";

  it("guarda el carrito con los precios del servidor y lo limpia", async () => {
    const lista = (await proveedor.listarProductos({ porPagina: 2 })).items;
    const items: ItemCarrito[] = lista.map((p) => ({
      productoId: p.id,
      slug: p.slug,
      nombre: p.nombre,
      precio: 999, // el cliente miente: el servidor ignora este valor
      precioAnterior: null,
      imagen: "",
      cantidad: 2,
      stock: p.stock,
    }));

    const guardados = await proveedor.guardarCarrito(id, items);
    expect(guardados).toHaveLength(2);
    expect(guardados[0].precio).toBe(lista[0].precio);
    expect(guardados[0].cantidad).toBe(2);
    expect(guardados[0].nombre).toBe(lista[0].nombre);

    const releido = await proveedor.getCarrito(id);
    expect(releido.map((i) => i.productoId)).toEqual(lista.map((p) => p.id));

    await proveedor.limpiarCarrito(id);
    expect(await proveedor.getCarrito(id)).toHaveLength(0);
  });

  it("alterna favoritos", async () => {
    const p = (await proveedor.listarProductos({ porPagina: 1 })).items[0];
    let favs = await proveedor.alternarFavorito(id, p.id);
    expect(favs).toContain(p.id);
    favs = await proveedor.alternarFavorito(id, p.id);
    expect(favs).not.toContain(p.id);
    expect(await proveedor.getFavoritos(id)).toHaveLength(0);
  });
});

/* ---------------- Direcciones ---------------- */

describe("direcciones", () => {
  const usuarioId = "usr-test-001";
  const base = {
    usuarioId,
    nombreCompleto: "Dave Cliente",
    telefono: "999111222",
    departamento: "La Libertad",
    provincia: "Ascope",
    distrito: "Chicama",
    direccion: "Av. Principal 123",
    referencia: "Frente al parque",
    indicaciones: "Timbre 2",
    porDefecto: true,
  };
  let dir1!: Direccion;
  let dir2!: Direccion;

  it("mantiene una sola dirección por defecto", async () => {
    dir1 = await proveedor.crearDireccion(base);
    expect(dir1.id).toMatch(/^dir-/);

    dir2 = await proveedor.crearDireccion({
      ...base,
      distrito: "Rázuri",
      direccion: "Jr. Las Flores 456",
    });

    const todas = await proveedor.getDirecciones(usuarioId);
    expect(todas).toHaveLength(2);
    expect(todas[0].id).toBe(dir2.id); // la nueva es la por defecto
    expect(todas[0].porDefecto).toBe(true);
    expect(todas[1].porDefecto).toBe(false); // la anterior perdió la bandera
  });

  it("actualiza y elimina direcciones", async () => {
    const r = await proveedor.actualizarDireccion(dir1.id, {
      distrito: "Chicama Centro",
      direccion: "Av. Principal 999",
    });
    expect(r?.distrito).toBe("Chicama Centro");
    expect(r?.direccion).toBe("Av. Principal 999");
    expect(await proveedor.actualizarDireccion("dir-fantasma", { distrito: "X" })).toBeNull();

    expect(await proveedor.eliminarDireccion(dir1.id)).toBe(true);
    expect(await proveedor.eliminarDireccion(dir1.id)).toBe(false);

    const restantes = await proveedor.getDirecciones(usuarioId);
    expect(restantes).toHaveLength(1);
    expect(restantes[0].id).toBe(dir2.id);
    expect(restantes[0].porDefecto).toBe(true);
  });
});

/* ---------------- Cupones ---------------- */

describe("cupones", () => {
  it("lista y valida los cupones del seed", async () => {
    const cupones = await proveedor.getCupones();
    expect(cupones).toHaveLength(2);

    const ok = await proveedor.validarCupon("BIENVENIDO10", 100);
    expect(ok.ok).toBe(true);
    expect(ok.cupon?.tipo).toBe("porcentaje");
    expect(ok.cupon?.valor).toBe(10);

    const minusculas = await proveedor.validarCupon("bienvenido10", 100);
    expect(minusculas.ok).toBe(true);

    const minimo = await proveedor.validarCupon("BULDAK5", 30); // mín. S/ 40
    expect(minimo.ok).toBe(false);
    expect(minimo.error).toContain("mínima");

    const inexistente = await proveedor.validarCupon("NOEXISTE", 100);
    expect(inexistente.ok).toBe(false);
  });

  it("crea, actualiza y elimina cupones", async () => {
    const nuevo = await proveedor.crearCupon({
      codigo: "TEST5",
      tipo: "fijo",
      valor: 5,
      activo: true,
      fechaInicio: null,
      fechaFin: null,
      usosMaximos: null,
      compraMinima: null,
      descripcion: "De prueba",
    });
    expect(nuevo.id).toMatch(/^cup-/);
    expect((await proveedor.getCupones()).length).toBe(3);

    const actualizado = await proveedor.actualizarCupon(nuevo.id, { valor: 7, activo: false });
    expect(actualizado?.valor).toBe(7);
    expect(actualizado?.activo).toBe(false);

    const desactivado = await proveedor.validarCupon("TEST5", 100);
    expect(desactivado.ok).toBe(false);
    expect(desactivado.error).toMatch(/desactivado/i);

    expect(await proveedor.eliminarCupon(nuevo.id)).toBe(true);
    expect(await proveedor.eliminarCupon(nuevo.id)).toBe(false);
    expect((await proveedor.getCupones()).length).toBe(2);
    expect(await proveedor.actualizarCupon("cup-fantasma", { valor: 1 })).toBeNull();
  });
});

/* ---------------- Configuración ---------------- */

describe("configuración", () => {
  it("lee la configuración guardada (con fallback al seed)", async () => {
    const cfg = await proveedor.getConfiguracion();
    expect(cfg.nombre).toBeTruthy();
    expect(typeof cfg.envioCostoLocal).toBe("number");
    expect(typeof cfg.envioGratisDesde).toBe("number");
    expect(cfg.metodosPago.yape).toBe(true);
  });

  it("guarda cambios parciales sin perder el resto", async () => {
    const antes = await proveedor.getConfiguracion();
    const nueva = await proveedor.guardarConfiguracion({ nombre: "TIENDA TEST" });
    expect(nueva.nombre).toBe("TIENDA TEST");
    expect(nueva.telefono).toBe(antes.telefono); // conservado
    expect((await proveedor.getConfiguracion()).nombre).toBe("TIENDA TEST");

    await proveedor.guardarConfiguracion({ nombre: antes.nombre }); // restaurar
    expect((await proveedor.getConfiguracion()).nombre).toBe(antes.nombre);
  });
});

/* ---------------- Pedidos ---------------- */

describe("pedidos", () => {
  const usuarioId = "usr-test-pedidos";
  let pA!: Producto;
  let pB!: Producto;
  let pedido1!: Pedido;

  const direccion = {
    nombreCompleto: "Dave Cliente",
    telefono: "999888777",
    departamento: "La Libertad",
    provincia: "Ascope",
    distrito: "Chicama",
    direccion: "Av. Principal 123",
    referencia: "Frente al parque",
    indicaciones: null,
  };

  beforeAll(async () => {
    await proveedor.crearPerfil({
      id: usuarioId,
      email: "pedidos.test@correo.com",
      nombre: "Pedidos",
      apellidos: "Test",
    });
    pA = await proveedor.crearProducto({
      slug: "test-pedido-a",
      nombre: "Pedido A",
      precio: 10,
      stock: 10,
      categoriaSlug: "snacks",
      marcaSlug: "itadakimasu",
      pais: "japon",
    });
    pB = await proveedor.crearProducto({
      slug: "test-pedido-b",
      nombre: "Pedido B",
      precio: 25.5,
      stock: 5,
      categoriaSlug: "ramen",
      marcaSlug: "nongshim",
      pais: "corea",
    });
  }, 30_000);

  it("crea un pedido con cupón, descuento y número únicos", async () => {
    // Hay un carrito previo: debe quedar limpio tras el pedido
    const carrito: ItemCarrito[] = [
      { productoId: pA.id, slug: pA.slug, nombre: pA.nombre, precio: 10, imagen: "", cantidad: 1, stock: 10 },
    ];
    await proveedor.guardarCarrito(usuarioId, carrito);
    expect(await proveedor.getCarrito(usuarioId)).toHaveLength(1);

    const cuponAntes = (await proveedor.getCupones()).find((c) => c.codigo === "BIENVENIDO10")!;

    const res = await proveedor.crearPedido({
      usuarioId,
      items: [
        { productoId: pA.id, cantidad: 2 },
        { productoId: pB.id, cantidad: 1 },
      ],
      metodoPago: "yape",
      metodoEnvio: "delivery_local",
      cuponCodigo: "BIENVENIDO10",
      direccion,
      notas: "Sin picante porfa",
      envio: 999, // el cliente manda 999: el servidor lo recalcula
    });

    expect(res.ok).toBe(true);
    const pedido = res.pedido!;
    expect(pedido.numero).toMatch(/^ITD-\d{4}-\d{5}$/);
    expect(pedido.subtotal).toBeCloseTo(45.5, 5); // 10×2 + 25.5
    expect(pedido.descuento).toBeCloseTo(4.55, 5); // 10 %
    expect(pedido.envio).toBe(0); // envío gratis recalculado
    expect(pedido.total).toBeCloseTo(40.95, 5);
    expect(pedido.estado).toBe("pago_pendiente"); // yape espera comprobante
    expect(pedido.cuponCodigo).toBe("BIENVENIDO10");
    expect(pedido.notas).toBe("Sin picante porfa");
    expect(pedido.items).toHaveLength(2);
    expect(pedido.items[0].productoId).toBe(pA.id);
    expect(pedido.items[0].precioUnitario).toBe(10);
    expect(pedido.items[0].subtotal).toBe(20);
    expect(pedido.historial).toHaveLength(1);
    expect(pedido.historial[0].estado).toBe("pago_pendiente");

    // Stock y vendidos descontados de forma atómica
    const a = (await proveedor.getProductoPorId(pA.id))!;
    const b = (await proveedor.getProductoPorId(pB.id))!;
    expect(a.stock).toBe(8);
    expect(a.vendidos).toBe(2);
    expect(b.stock).toBe(4);
    expect(b.vendidos).toBe(1);

    // Carrito limpio, cupón usado, movimiento de venta registrado
    expect(await proveedor.getCarrito(usuarioId)).toHaveLength(0);
    const cuponDespues = (await proveedor.getCupones()).find((c) => c.codigo === "BIENVENIDO10")!;
    expect(cuponDespues.usosActuales).toBe(cuponAntes.usosActuales + 1);
    expect((await proveedor.getMovimientos(pA.id)).some((m) => m.tipo === "venta")).toBe(true);

    // Recuperación por número e id, con items snapshot
    const porNumero = await proveedor.getPedidoPorNumero(pedido.numero);
    expect(porNumero?.items).toHaveLength(2);
    expect(porNumero?.items[0].nombre).toBe("Pedido A");
    expect((await proveedor.getPedido(pedido.id))?.id).toBe(pedido.id);
    expect(await proveedor.getPedidoPorNumero("ITD-0000-00000")).toBeNull();

    pedido1 = pedido;
  }, 30_000);

  it("marca 'pendiente' con contra entrega y envío gratis en recojo", async () => {
    const res = await proveedor.crearPedido({
      usuarioId,
      items: [{ productoId: pA.id, cantidad: 1 }],
      metodoPago: "contra_entrega",
      metodoEnvio: "recojo_tienda",
      cuponCodigo: null,
      direccion,
      envio: 50, // ignorado por el servidor
    });
    expect(res.ok).toBe(true);
    expect(res.pedido!.estado).toBe("pendiente");
    expect(res.pedido!.envio).toBe(0);
    expect(res.pedido!.total).toBe(10);
  });

  it("rechaza stock insuficiente, carrito vacío y cupones inválidos", async () => {
    const sinStock = await proveedor.crearPedido({
      usuarioId,
      items: [{ productoId: pB.id, cantidad: 99 }],
      metodoPago: "yape",
      metodoEnvio: "recojo_tienda",
      direccion,
      envio: 0,
    });
    expect(sinStock.ok).toBe(false);
    expect(sinStock.error).toContain("Solo quedan");

    const vacio = await proveedor.crearPedido({
      usuarioId,
      items: [],
      metodoPago: "yape",
      metodoEnvio: "recojo_tienda",
      direccion,
      envio: 0,
    });
    expect(vacio.ok).toBe(false);
    expect(vacio.error).toMatch(/vacío/i);

    const fantasma = await proveedor.crearPedido({
      usuarioId,
      items: [{ productoId: "prod-fantasma", cantidad: 1 }],
      metodoPago: "yape",
      metodoEnvio: "recojo_tienda",
      direccion,
      envio: 0,
    });
    expect(fantasma.ok).toBe(false);
    expect(fantasma.error).toMatch(/no está disponible/i);

    const cuponMalo = await proveedor.crearPedido({
      usuarioId,
      items: [{ productoId: pA.id, cantidad: 1 }],
      metodoPago: "yape",
      metodoEnvio: "recojo_tienda",
      cuponCodigo: "NOCUPON",
      direccion,
      envio: 0,
    });
    expect(cuponMalo.ok).toBe(false);
    expect(cuponMalo.error).toMatch(/cupón/i);

    const cuponMinimo = await proveedor.crearPedido({
      usuarioId,
      items: [{ productoId: pA.id, cantidad: 1 }],
      metodoPago: "yape",
      metodoEnvio: "recojo_tienda",
      cuponCodigo: "BULDAK5", // requiere S/ 40
      direccion,
      envio: 0,
    });
    expect(cuponMinimo.ok).toBe(false);
    expect(cuponMinimo.error).toContain("mínimo");

    // Ningún intento fallido tocó el stock
    expect((await proveedor.getProductoPorId(pA.id))!.stock).toBe(7);
    expect((await proveedor.getProductoPorId(pB.id))!.stock).toBe(4);
  });

  it("cobra el envío según la configuración del servidor", async () => {
    const cfg = await proveedor.getConfiguracion();
    await proveedor.guardarConfiguracion({ envioCostoLocal: 7, envioGratisDesde: 500 });

    const res = await proveedor.crearPedido({
      usuarioId,
      items: [{ productoId: pA.id, cantidad: 1 }],
      metodoPago: "yape",
      metodoEnvio: "delivery_local",
      direccion,
      envio: 0,
    });
    expect(res.ok).toBe(true);
    expect(res.pedido!.envio).toBe(7);
    expect(res.pedido!.total).toBeCloseTo(17, 5); // 10 + 7

    await proveedor.guardarConfiguracion({
      envioCostoLocal: cfg.envioCostoLocal,
      envioGratisDesde: cfg.envioGratisDesde,
    });
  });

  it("lista pedidos por usuario y por admin con filtros", async () => {
    const usuario = await proveedor.listarPedidosUsuario(usuarioId);
    expect(usuario.length).toBe(3);

    const todos = await proveedor.listarPedidosAdmin();
    expect(todos.length).toBeGreaterThanOrEqual(usuario.length);
    expect(todos[0].creadoEn >= todos[todos.length - 1].creadoEn).toBe(true); // más reciente primero

    const porEstado = await proveedor.listarPedidosAdmin({ estado: "pago_pendiente" });
    expect(porEstado.length).toBeGreaterThanOrEqual(1);
    expect(porEstado.every((p) => p.estado === "pago_pendiente")).toBe(true);

    const porNumero = await proveedor.listarPedidosAdmin({ q: pedido1.numero });
    expect(porNumero.some((p) => p.id === pedido1.id)).toBe(true);

    const porNombre = await proveedor.listarPedidosAdmin({ q: "Dave Cliente" });
    expect(porNombre.length).toBeGreaterThanOrEqual(1);
  });

  it("actualiza el estado con historial y auditoría", async () => {
    const r = await proveedor.actualizarEstadoPedido(
      pedido1.id,
      "preparando",
      "Listo para salir",
      "admin-test"
    );
    expect(r?.estado).toBe("preparando");
    expect(r?.historial).toHaveLength(2);
    expect(r?.historial[1].nota).toBe("Listo para salir");
    expect(await proveedor.actualizarEstadoPedido("ped-fantasma", "preparando")).toBeNull();

    const aud = await proveedor.getAuditoria(50);
    expect(aud.some((a) => a.detalle.includes(pedido1.numero))).toBe(true);
    expect(aud.some((a) => a.actor === "admin-test")).toBe(true);
  });

  it("confirma el pago manualmente", async () => {
    const pendiente = (await proveedor.listarPedidosUsuario(usuarioId)).find(
      (p) => p.estado === "pendiente"
    );
    expect(pendiente).toBeDefined();

    const r = await proveedor.confirmarPagoManual(pendiente!.id, "transferencia", "admin-test");
    expect(r?.estado).toBe("pago_confirmado");
    expect(r?.metodoPago).toBe("transferencia");
    const ultimo = r!.historial[r!.historial.length - 1];
    expect(ultimo.nota).toContain("admin-test");

    expect(await proveedor.confirmarPagoManual("ped-fantasma", "yape", "admin-test")).toBeNull();
  });
});

/* ---------------- Reseñas ---------------- */

describe("reseñas", () => {
  const usuarioId = "usr-test-resenas";
  let producto!: Producto;

  beforeAll(async () => {
    await proveedor.crearPerfil({
      id: usuarioId,
      email: "resenas.test@correo.com",
      nombre: "Reseñas",
      apellidos: "Test",
    });
    producto = await proveedor.crearProducto({
      slug: "test-resena",
      nombre: "Producto Reseña",
      precio: 15,
      stock: 10,
    });
  }, 30_000);

  it("devuelve vacío cuando no hay reseñas", async () => {
    expect(await proveedor.getResenas(producto.id)).toHaveLength(0);
  });

  it("crea reseñas y recalcula la valoración del producto", async () => {
    const r1 = await proveedor.crearResena({
      productoId: producto.id,
      usuarioId,
      usuarioNombre: "Reseñador Uno",
      calificacion: 5,
      titulo: "Excelente",
      comentario: "Me encantó",
    });
    expect(r1.id).toMatch(/^res-/);

    let p = (await proveedor.getProductoPorId(producto.id))!;
    expect(p.numValoraciones).toBe(1);
    expect(p.valoracion).toBe(5);

    await proveedor.crearResena({
      productoId: producto.id,
      usuarioId,
      usuarioNombre: "Reseñador Dos",
      calificacion: 3,
      titulo: "Regular",
      comentario: "Podría mejorar",
    });
    p = (await proveedor.getProductoPorId(producto.id))!;
    expect(p.numValoraciones).toBe(2);
    expect(p.valoracion).toBe(4); // (5 + 3) / 2

    expect(await proveedor.getResenas(producto.id)).toHaveLength(2);
    expect((await proveedor.getResenasUsuario(usuarioId)).length).toBe(2);
  });
});

/* ---------------- Newsletter y auditoría ---------------- */

describe("newsletter y auditoría", () => {
  it("suscribe una vez y rechaza duplicados", async () => {
    expect((await proveedor.suscribir("news.test@correo.com")).ok).toBe(true);
    const dup = await proveedor.suscribir("NEWS.TEST@correo.com"); // normaliza
    expect(dup.ok).toBe(false);
    expect(dup.error).toMatch(/suscrito/i);
  });

  it("registra y consulta la auditoría", async () => {
    await proveedor.registrarAuditoria({
      actor: "test",
      accion: "prueba",
      detalle: "Entrada de prueba",
    });
    const aud = await proveedor.getAuditoria(5);
    expect(aud.length).toBeGreaterThan(0);
    expect(aud.length).toBeLessThanOrEqual(5);
    expect(typeof aud[0].fecha).toBe("string");
    expect(aud.some((a) => a.detalle === "Entrada de prueba")).toBe(true);
  });
});

/* ---------------- Estadísticas ---------------- */

describe("estadísticas", () => {
  it("calcula el dashboard completo con datos reales", async () => {
    const e = await proveedor.getEstadisticas();

    expect(e.pedidosTotales).toBe(3); // los creados en esta suite
    expect(e.ventasTotales).toBeGreaterThan(0);
    expect(e.ventasHoy).toBeGreaterThan(0);
    expect(e.ventasMes).toBeGreaterThanOrEqual(e.ventasHoy);
    expect(e.ticketPromedio).toBeGreaterThan(0);
    expect(e.pedidosCompletados).toBe(0);
    expect(e.pedidosPendientes).toBeGreaterThanOrEqual(1);

    expect(e.productosDisponibles).toBeGreaterThan(20);
    expect(e.productosAgotados).toBeGreaterThanOrEqual(1); // prod-001 agotado
    expect(e.productosBajos).toBeGreaterThanOrEqual(1); // test-pedido-b con stock bajo
    expect(e.clientes).toBeGreaterThanOrEqual(3);

    expect(e.serieVentas).toHaveLength(30);
    expect(e.serieVentas[29].fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof e.serieVentas[29].total).toBe("number");

    expect(e.topProductos.length).toBeGreaterThan(0);
    expect(e.topProductos[0].unidades).toBeGreaterThan(0);
    expect(typeof e.topProductos[0].ingresos).toBe("number");

    expect(e.actividadReciente.length).toBeGreaterThan(0);
    expect(typeof e.actividadReciente[0].tipo).toBe("string");
  }, 30_000);
});
