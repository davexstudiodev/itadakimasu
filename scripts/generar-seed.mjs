/* ============================================================
   Genera db/migrations/002_seed.sql a partir de data/db.json
   (modo local / demo). Semilla idempotente: todos los INSERT
   usan ON CONFLICT DO NOTHING, así que re-ejecutarla no duplica
   ni pisa cambios hechos en producción.

   Uso: node scripts/generar-seed.mjs
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const raiz = process.cwd();
const db = JSON.parse(readFileSync(path.join(raiz, "data", "db.json"), "utf8"));

/* ---------- helpers SQL ---------- */
const str = (v) =>
  v === null || v === undefined
    ? "NULL"
    : `'${String(v).replace(/'/g, "''")}'`;
const num = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? "NULL" : String(Number(v)));
const bool = (v) => (v ? "TRUE" : "FALSE");
const lista = (v) => {
  if (v === null || v === undefined) return "NULL";
  const arr = Array.isArray(v) ? v : [v];
  return arr.length === 0 ? "'{}'" : `ARRAY[${arr.map(str).join(",")}]`;
};
const fecha = (v) => (v === null || v === undefined ? "NULL" : `${str(v)}::timestamptz`);
const json = (v) => `${str(JSON.stringify(v))}::jsonb`;

const lineas = [];
const add = (s) => lineas.push(s);

/* ---------- cabecera ---------- */
add("/* ============================================================");
add("   ITADAKIMASU — Migración 002: seed de datos demo");
add("   Generado automáticamente por scripts/generar-seed.mjs");
add("   desde data/db.json. NO editar a mano (regenerar si hace falta).");
add("   Idempotente: seguro de re-ejecutar.");
add("   ============================================================ */");
add("");

/* ---------- categorías ---------- */
add("-- Categorías");
for (const c of db.categorias ?? []) {
  add(
    `INSERT INTO categorias (slug, nombre, descripcion, icono, orden) VALUES (${str(c.slug)}, ${str(c.nombre)}, ${str(c.descripcion ?? "")}, ${str(c.icono ?? "")}, ${num(c.orden ?? 0)}) ON CONFLICT (slug) DO NOTHING;`
  );
}
add("");

/* ---------- marcas ---------- */
add("-- Marcas");
for (const m of db.marcas ?? []) {
  add(
    `INSERT INTO marcas (slug, nombre, pais) VALUES (${str(m.slug)}, ${str(m.nombre)}, ${str(m.pais)}) ON CONFLICT (slug) DO NOTHING;`
  );
}
add("");

/* ---------- productos ---------- */
add("-- Productos");
for (const p of db.productos ?? []) {
  add(
    `INSERT INTO productos (id, slug, nombre, nombre_original, descripcion, descripcion_larga, precio, precio_anterior, categoria_slug, marca_slug, pais, imagenes, ingredientes, alergenos, preparacion, peso, stock, stock_minimo, destacado, activo, etiquetas, valoracion, num_valoraciones, vendidos, es_demo, creado_en, actualizado_en) VALUES (` +
      [
        str(p.id),
        str(p.slug),
        str(p.nombre),
        str(p.nombreOriginal ?? null),
        str(p.descripcion ?? ""),
        str(p.descripcionLarga ?? null),
        num(p.precio ?? 0),
        num(p.precioAnterior ?? null),
        str(p.categoriaSlug),
        str(p.marcaSlug),
        str(p.pais),
        lista(p.imagenes),
        lista(p.ingredientes ?? null),
        lista(p.alergenos ?? null),
        str(p.preparacion ?? null),
        str(p.peso ?? null),
        num(p.stock ?? 0),
        num(p.stockMinimo ?? 5),
        bool(p.destacado),
        bool(p.activo !== false),
        lista(p.etiquetas ?? []),
        num(p.valoracion ?? 0),
        num(p.numValoraciones ?? 0),
        num(p.vendidos ?? 0),
        bool(p.esDemo),
        fecha(p.creadoEn),
        fecha(p.actualizadoEn),
      ].join(", ") +
      ") ON CONFLICT (id) DO NOTHING;"
  );
}
add("");

/* ---------- cupones ---------- */
add("-- Cupones");
for (const c of db.cupones ?? []) {
  add(
    `INSERT INTO cupones (id, codigo, tipo, valor, activo, fecha_inicio, fecha_fin, usos_maximos, usos_actuales, compra_minima, descripcion) VALUES (` +
      [
        str(c.id),
        str(c.codigo),
        str(c.tipo),
        num(c.valor),
        bool(c.activo),
        fecha(c.fechaInicio ?? null),
        fecha(c.fechaFin ?? null),
        num(c.usosMaximos ?? null),
        num(c.usosActuales ?? 0),
        num(c.compraMinima ?? null),
        str(c.descripcion ?? null),
      ].join(", ") +
      ") ON CONFLICT (id) DO NOTHING;"
  );
}
add("");

/* ---------- configuración ---------- */
add("-- Configuración de la tienda");
add(
  `INSERT INTO configuracion (clave, datos) VALUES ('tienda', ${json(db.configuracion)}) ON CONFLICT (clave) DO NOTHING;`
);
add("");

/* ---------- usuarios: solo el administrador ----------
   En producción las cuentas reales nacen en Supabase Auth;
   el perfil del admin se inserta aquí y su rol se confirma
   con UPDATE perfiles SET rol='admin' si la cuenta se crea
   desde la aplicación. */
add("-- Usuario administrador (id fijo: usr-admin-001)");
const admin = (db.usuarios ?? []).find((u) => u.rol === "admin");
if (admin) {
  add(
    `INSERT INTO perfiles (id, email, nombre, apellidos, telefono, rol, activo, password_hash, creado_en) VALUES (` +
      [
        str(admin.id),
        str(admin.email),
        str(admin.nombre),
        str(admin.apellidos),
        str(admin.telefono ?? null),
        "'admin'",
        bool(admin.activo !== false),
        str(admin.passwordHash ?? null),
        fecha(admin.creadoEn),
      ].join(", ") +
      ") ON CONFLICT (id) DO NOTHING;"
  );
}
add("");

/* ---------- reseñas ---------- */
add("-- Reseñas (usuarios de demostración sin cuenta: sin FK a perfiles)");
for (const r of db.resenas ?? []) {
  add(
    `INSERT INTO resenas (id, producto_id, usuario_id, usuario_nombre, calificacion, titulo, comentario, creada_en) VALUES (` +
      [
        str(r.id),
        str(r.productoId),
        str(r.usuarioId),
        str(r.usuarioNombre),
        num(r.calificacion),
        str(r.titulo),
        str(r.comentario),
        fecha(r.creadaEn),
      ].join(", ") +
      ") ON CONFLICT (id) DO NOTHING;"
  );
}
add("");

/* ---------- pie ---------- */
add("-- Nota: pedidos, carritos, favoritos, movimientos y auditoría");
add("-- inician vacíos en producción (los datos demo del modo local no se migran).");
add("");

const salida = path.join(raiz, "db", "migrations", "002_seed.sql");
mkdirSync(path.dirname(salida), { recursive: true });
writeFileSync(salida, `${lineas.join("\n")}\n`, "utf8");

console.log(`OK → ${salida}`);
console.log(
  `   ${db.categorias?.length ?? 0} categorías, ${db.marcas?.length ?? 0} marcas, ` +
    `${db.productos?.length ?? 0} productos, ${db.cupones?.length ?? 0} cupones, ` +
    `${db.resenas?.length ?? 0} reseñas, ${admin ? 1 : 0} admin`
);
