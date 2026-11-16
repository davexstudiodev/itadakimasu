"use server";

import { redirect } from "next/navigation";
import { getProvider } from "@/lib/data";
import { getUsuarioActual } from "@/lib/auth";
import { esquemaCheckout } from "@/server/validations";
import type { MetodoEnvio, ResultadoAccion } from "@/types";

/* ============================================================
   Checkout y pedidos.
   El total, el envío y los precios se recalculan SIEMPRE
   en el servidor: nada del navegador se confía.
   ============================================================ */

export type TotalesPreview = {
  subtotal: number;
  descuento: number;
  envio: number;
  total: number;
  error?: string;
};

/** Vista previa autoritativa de totales (se llama al cambiar envío o cupón). */
export async function calcularTotales(
  metodoEnvio: MetodoEnvio,
  cuponCodigo?: string
): Promise<TotalesPreview> {
  const provider = getProvider();
  const usuario = await getUsuarioActual();
  const items = usuario ? await provider.getCarrito(usuario.id) : [];
  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  let descuento = 0;
  let error: string | undefined;
  if (cuponCodigo?.trim()) {
    const resultado = await provider.validarCupon(cuponCodigo, subtotal);
    if (resultado.ok && resultado.cupon) {
      descuento =
        resultado.cupon.tipo === "porcentaje"
          ? Math.round(subtotal * (resultado.cupon.valor / 100) * 100) / 100
          : Math.min(resultado.cupon.valor, subtotal);
    } else {
      error = resultado.error;
    }
  }

  const cfg = await provider.getConfiguracion();
  let envio = 0;
  if (metodoEnvio === "delivery_local") envio = cfg.envioCostoLocal;
  if (subtotal - descuento >= cfg.envioGratisDesde && metodoEnvio !== "recojo_tienda") envio = 0;

  return {
    subtotal,
    descuento,
    envio,
    total: Math.max(0, subtotal - descuento + envio),
    error,
  };
}

/** Crea el pedido (requiere sesión). Redirige a la confirmación. */
export async function crearPedido(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { ok: false, error: "Inicia sesión para finalizar la compra" };

  const itemsCrudos = String(formData.get("items") ?? "[]");
  let items: { productoId: string; cantidad: number }[] = [];
  try {
    items = JSON.parse(itemsCrudos);
  } catch {
    return { ok: false, error: "Carrito inválido" };
  }

  const parseado = esquemaCheckout.safeParse({
    items,
    metodoPago: String(formData.get("metodoPago") ?? ""),
    metodoEnvio: String(formData.get("metodoEnvio") ?? ""),
    cuponCodigo: String(formData.get("cuponCodigo") ?? ""),
    notas: String(formData.get("notas") ?? ""),
    aceptaTerminos: formData.get("aceptaTerminos") === "on",
    direccion: {
      nombreCompleto: String(formData.get("nombreCompleto") ?? ""),
      telefono: String(formData.get("telefono") ?? ""),
      departamento: String(formData.get("departamento") ?? ""),
      provincia: String(formData.get("provincia") ?? ""),
      distrito: String(formData.get("distrito") ?? ""),
      direccion: String(formData.get("direccion") ?? ""),
      referencia: String(formData.get("referencia") ?? ""),
      indicaciones: String(formData.get("indicaciones") ?? ""),
    },
  });

  if (!parseado.success) {
    const problema = parseado.error.issues[0];
    return {
      ok: false,
      campo: String(problema.path.join(".") ?? ""),
      error: problema.message,
    };
  }

  const resultado = await getProvider().crearPedido({
    usuarioId: usuario.id,
    items: parseado.data.items,
    metodoPago: parseado.data.metodoPago,
    metodoEnvio: parseado.data.metodoEnvio,
    cuponCodigo: parseado.data.cuponCodigo || null,
    direccion: {
      nombreCompleto: parseado.data.direccion.nombreCompleto,
      telefono: parseado.data.direccion.telefono,
      departamento: parseado.data.direccion.departamento,
      provincia: parseado.data.direccion.provincia,
      distrito: parseado.data.direccion.distrito,
      direccion: parseado.data.direccion.direccion,
      referencia: parseado.data.direccion.referencia || null,
      indicaciones: parseado.data.direccion.indicaciones || null,
    },
    notas: parseado.data.notas || null,
    envio: 0, // recalculado internamente
  });

  if (!resultado.ok || !resultado.pedido) {
    return { ok: false, error: resultado.error ?? "No se pudo crear el pedido" };
  }

  // El pedido ya descontó stock: vaciar el carrito del servidor.
  // (El carrito local lo limpia la página de confirmación.)
  await getProvider().limpiarCarrito(usuario.id);

  redirect(`/confirmacion/${resultado.pedido.numero}`);
}

/** Dirección por defecto del usuario para prellenar el checkout. */
export async function direccionPorDefecto() {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;
  const direcciones = await getProvider().getDirecciones(usuario.id);
  return direcciones.find((d) => d.porDefecto) ?? direcciones[0] ?? null;
}

/** Cupones válidos (para el selector de checkout). */
export async function cuponesValidos() {
  const cupones = await getProvider().getCupones();
  const hoy = Date.now();
  return cupones.filter(
    (c) =>
      c.activo &&
      (!c.fechaInicio || new Date(c.fechaInicio).getTime() <= hoy) &&
      (!c.fechaFin || new Date(c.fechaFin).getTime() >= hoy) &&
      (c.usosMaximos == null || c.usosActuales < c.usosMaximos)
  );
}
