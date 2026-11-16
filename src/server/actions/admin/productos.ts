"use server";

import { revalidatePath } from "next/cache";
import { getProvider } from "@/lib/data";
import { esquemaProducto } from "@/server/validations";
import type { ResultadoAccion } from "@/types";
import { exigirAdminAccion, errorDeZod, numero, numeroOpcional, casilla } from "./comun";

/* ============================================================
   CRUD de productos (solo admin, verificado en servidor).
   ============================================================ */

function aListas(valor: string | null | undefined): string[] {
  return (valor ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function guardarProducto(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const auth = await exigirAdminAccion();
  if ("resultado" in auth) return auth.resultado;

  const id = String(formData.get("id") ?? "");
  const precioAnterior = numeroOpcional(formData, "precioAnterior");

  const parseado = esquemaProducto.safeParse({
    nombre: String(formData.get("nombre") ?? ""),
    nombreOriginal: String(formData.get("nombreOriginal") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    descripcion: String(formData.get("descripcion") ?? ""),
    descripcionLarga: String(formData.get("descripcionLarga") ?? ""),
    precio: numero(formData, "precio", -1),
    precioAnterior,
    categoriaSlug: String(formData.get("categoriaSlug") ?? ""),
    marcaSlug: String(formData.get("marcaSlug") ?? ""),
    pais: String(formData.get("pais") ?? ""),
    stock: numero(formData, "stock"),
    stockMinimo: numero(formData, "stockMinimo", 5),
    destacado: casilla(formData, "destacado"),
    activo: casilla(formData, "activo"),
    etiquetas: String(formData.get("etiquetas") ?? ""),
    peso: String(formData.get("peso") ?? ""),
    preparacion: String(formData.get("preparacion") ?? ""),
    ingredientes: String(formData.get("ingredientes") ?? ""),
    alergenos: String(formData.get("alergenos") ?? ""),
    imagenes: String(formData.get("imagenes") ?? ""),
  });
  if (!parseado.success) return errorDeZod(parseado.error.issues);

  const d = parseado.data;
  const provider = getProvider();

  // Slug único en todo el catálogo (incluye productos desactivados)
  const catalogo = await provider.listarProductos({
    pagina: 1,
    porPagina: 60,
    incluirInactivos: true,
  });
  if (catalogo.items.some((p) => p.slug === d.slug && p.id !== id))
    return { ok: false, campo: "slug", error: "Ya existe un producto con ese slug" };

  const datos = {
    nombre: d.nombre,
    nombreOriginal: d.nombreOriginal || null,
    slug: d.slug,
    descripcion: d.descripcion,
    descripcionLarga: d.descripcionLarga || null,
    precio: d.precio,
    precioAnterior,
    categoriaSlug: d.categoriaSlug,
    marcaSlug: d.marcaSlug,
    pais: d.pais,
    imagenes: d.imagenes
      .split(/\r?\n/)
      .map((imagen) => imagen.trim())
      .filter(Boolean),
    ingredientes: aListas(d.ingredientes),
    alergenos: aListas(d.alergenos),
    preparacion: d.preparacion || null,
    peso: d.peso || null,
    stock: d.stock,
    stockMinimo: d.stockMinimo,
    destacado: d.destacado,
    activo: d.activo,
    etiquetas: aListas(d.etiquetas),
  };

  if (id) {
    const actual = await provider.getProductoPorId(id);
    if (!actual) return { ok: false, error: "Producto no encontrado" };
    await provider.actualizarProducto(id, datos);
  } else {
    await provider.crearProducto(datos);
  }

  await provider.registrarAuditoria({
    actor: auth.admin.email,
    accion: "producto",
    detalle: `${id ? "Actualizó" : "Creó"} «${d.nombre}»`,
  });

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  revalidatePath(`/producto/${d.slug}`);
  return { ok: true, datos: { mensaje: id ? "Producto actualizado" : "Producto creado" } };
}

/** Desactiva (borrado lógico) un producto sin romper pedidos ni reseñas. */
export async function eliminarProducto(id: string): Promise<ResultadoAccion> {
  const auth = await exigirAdminAccion();
  if ("resultado" in auth) return auth.resultado;
  if (!id) return { ok: false, error: "Producto inválido" };

  const provider = getProvider();
  const producto = await provider.getProductoPorId(id);
  if (!producto) return { ok: false, error: "Producto no encontrado" };

  await provider.eliminarProducto(id);
  await provider.registrarAuditoria({
    actor: auth.admin.email,
    accion: "producto",
    detalle: `Desactivó «${producto.nombre}»`,
  });

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  revalidatePath(`/producto/${producto.slug}`);
  return { ok: true, datos: { mensaje: "Producto desactivado" } };
}

/** Elimina productos de forma permanente y conserva los snapshots de pedidos. */
export async function eliminarProductosDefinitivamente(idsEntrada: unknown): Promise<ResultadoAccion> {
  const auth = await exigirAdminAccion();
  if ("resultado" in auth) return auth.resultado;
  if (!Array.isArray(idsEntrada) || idsEntrada.length === 0 || idsEntrada.length > 60)
    return { ok: false, error: "Selecciona entre 1 y 60 productos" };
  if (idsEntrada.some((id) => typeof id !== "string" || !id.trim()))
    return { ok: false, error: "Selección de productos no válida" };

  const ids = [...new Set((idsEntrada as string[]).map((id) => id.trim()))];
  const provider = getProvider();
  const productos = await Promise.all(ids.map((id) => provider.getProductoPorId(id)));
  if (productos.some((p) => !p)) return { ok: false, error: "Uno o más productos ya no existen" };

  const cantidad = await provider.eliminarProductosDefinitivamente(ids);
  if (cantidad !== ids.length)
    return { ok: false, error: "No se pudieron eliminar todos los productos. Actualiza la lista e inténtalo de nuevo." };

  const lista = productos.filter((p) => p !== null);
  await provider.registrarAuditoria({
    actor: auth.admin.email,
    accion: "producto",
    detalle: `Eliminó permanentemente ${lista.length} producto${lista.length === 1 ? "" : "s"}: ${lista.map((p) => `«${p.nombre}»`).join(", ")}`,
  });

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  for (const producto of lista) revalidatePath(`/producto/${producto.slug}`);
  return {
    ok: true,
    datos: { mensaje: `${lista.length} producto${lista.length === 1 ? " eliminado" : "s eliminados"} permanentemente` },
  };
}

/** Activa o desactiva un producto desde la tabla admin. */
export async function alternarProducto(id: string, activo: boolean): Promise<ResultadoAccion> {
  const auth = await exigirAdminAccion();
  if ("resultado" in auth) return auth.resultado;

  const provider = getProvider();
  const producto = await provider.getProductoPorId(id);
  if (!producto) return { ok: false, error: "Producto no encontrado" };

  await provider.actualizarProducto(id, { activo });
  await provider.registrarAuditoria({
    actor: auth.admin.email,
    accion: "producto",
    detalle: `${activo ? "Activó" : "Desactivó"} «${producto.nombre}»`,
  });

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  return { ok: true, datos: { mensaje: activo ? "Producto activado" : "Producto desactivado" } };
}
