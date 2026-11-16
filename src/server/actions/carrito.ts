"use server";

import { getProvider } from "@/lib/data";
import { getUsuarioActual } from "@/lib/auth";
import type { ItemCarrito } from "@/types";
import { esquemaResena } from "@/server/validations";
import type { ResultadoAccion } from "@/types";

/* ============================================================
   Carrito persistente en servidor.
   Los precios y el stock SIEMPRE se verifican contra la BD;
   lo que envíe el navegador solo aporta productoId y cantidad.
   ============================================================ */

function sanearItems(items: unknown): ItemCarrito[] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 50).map((i) => {
    const item = i as Partial<ItemCarrito>;
    return {
      productoId: String(item.productoId ?? ""),
      slug: String(item.slug ?? ""),
      nombre: String(item.nombre ?? ""),
      precio: Number(item.precio ?? 0),
      precioAnterior: item.precioAnterior ?? null,
      imagen: String(item.imagen ?? "/logo.png"),
      cantidad: Math.min(99, Math.max(1, Math.floor(Number(item.cantidad ?? 1)))),
      stock: Math.max(0, Math.floor(Number(item.stock ?? 0))),
    };
  }).filter((i) => i.productoId);
}

/** Sincroniza el carrito local (localStorage) con el del servidor. */
export async function sincronizarCarrito(items: unknown): Promise<ItemCarrito[]> {
  const usuario = await getUsuarioActual();
  if (!usuario) return [];
  const provider = getProvider();

  // Reconstruir desde la BD: precios y stock reales
  const sanos = sanearItems(items);
  const reconstruido: ItemCarrito[] = [];
  for (const item of sanos) {
    const producto = await provider.getProductoPorSlug(item.slug);
    if (!producto) continue;
    reconstruido.push({
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      precio: producto.precio,
      precioAnterior: producto.precioAnterior ?? null,
      imagen: producto.imagenes[0] ?? "/logo.png",
      cantidad: Math.min(item.cantidad, Math.max(producto.stock, 0)),
      stock: producto.stock,
    });
  }
  return provider.guardarCarrito(usuario.id, reconstruido.filter((i) => i.cantidad > 0));
}

/** Fusiona el carrito de invitado con el del usuario al iniciar sesión. */
export async function fusionarCarrito(items: unknown): Promise<ItemCarrito[]> {
  const usuario = await getUsuarioActual();
  if (!usuario) return [];
  const provider = getProvider();
  const actual = await provider.getCarrito(usuario.id);
  const invitado = sanearItems(items);

  const mapa = new Map<string, ItemCarrito>();
  actual.forEach((i) => mapa.set(i.productoId, i));
  for (const item of invitado) {
    const existente = mapa.get(item.productoId);
    if (existente) {
      existente.cantidad = Math.min(99, existente.cantidad + item.cantidad);
    } else {
      const producto = await provider.getProductoPorSlug(item.slug);
      if (!producto) continue;
      mapa.set(producto.id, {
        productoId: producto.id,
        slug: producto.slug,
        nombre: producto.nombre,
        precio: producto.precio,
        precioAnterior: producto.precioAnterior ?? null,
        imagen: producto.imagenes[0] ?? "/logo.png",
        cantidad: Math.min(item.cantidad, Math.max(producto.stock, 0)),
        stock: producto.stock,
      });
    }
  }
  return provider.guardarCarrito(
    usuario.id,
    [...mapa.values()].filter((i) => i.cantidad > 0)
  );
}

/** Vacía el carrito del usuario (tras comprar o por petición). */
export async function vaciarCarritoServidor(): Promise<void> {
  const usuario = await getUsuarioActual();
  if (!usuario) return;
  await getProvider().limpiarCarrito(usuario.id);
}

/** Lee el carrito persistido en servidor (para restaurar sesión). */
export async function leerCarritoServidor(): Promise<ItemCarrito[]> {
  const usuario = await getUsuarioActual();
  if (!usuario) return [];
  return getProvider().getCarrito(usuario.id);
}

/* ---------------- Favoritos ---------------- */

export async function alternarFavorito(productoId: string): Promise<{
  ok: boolean;
  favoritos: string[];
  error?: string;
}> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { ok: false, favoritos: [], error: "inicia_sesion" };
  const favoritos = await getProvider().alternarFavorito(usuario.id, productoId);
  return { ok: true, favoritos };
}

export async function leerFavoritos(): Promise<string[]> {
  const usuario = await getUsuarioActual();
  if (!usuario) return [];
  return getProvider().getFavoritos(usuario.id);
}

/* ---------------- Reseñas ---------------- */

export async function crearResena(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { ok: false, error: "Inicia sesión para opinar" };

  const parseado = esquemaResena.safeParse({
    productoId: String(formData.get("productoId") ?? ""),
    calificacion: Number(formData.get("calificacion") ?? 0),
    titulo: String(formData.get("titulo") ?? ""),
    comentario: String(formData.get("comentario") ?? ""),
  });
  if (!parseado.success) {
    const problema = parseado.error.issues[0];
    return { ok: false, campo: String(problema.path[0] ?? ""), error: problema.message };
  }

  const provider = getProvider();
  await provider.crearResena({
    productoId: parseado.data.productoId,
    usuarioId: usuario.id,
    usuarioNombre: `${usuario.nombre} ${usuario.apellidos.charAt(0)}.`,
    calificacion: parseado.data.calificacion,
    titulo: parseado.data.titulo,
    comentario: parseado.data.comentario,
  });
  return { ok: true, datos: { mensaje: "¡Gracias por tu reseña!" } };
}
