"use server";

import { revalidatePath } from "next/cache";
import { getProvider } from "@/lib/data";
import type { EstadoPedido, MetodoPago, ResultadoAccion } from "@/types";
import { exigirAdminAccion } from "./comun";

/* ============================================================
   Gestión de pedidos (solo admin).
   El pago manual SIEMPRE lo confirma una persona: aquí nunca
   se simula una pasarela de pago.
   ============================================================ */

const ESTADOS_VALIDOS: EstadoPedido[] = [
  "pendiente",
  "pago_pendiente",
  "pago_confirmado",
  "preparando",
  "en_camino",
  "entregado",
  "cancelado",
  "reembolsado",
];

const PAGOS_VALIDOS: MetodoPago[] = ["yape", "plin", "transferencia", "contra_entrega", "pasarela"];

export async function cambiarEstadoPedido(
  id: string,
  estado: string,
  nota?: string
): Promise<ResultadoAccion> {
  const auth = await exigirAdminAccion();
  if ("resultado" in auth) return auth.resultado;
  if (!id) return { ok: false, error: "Pedido inválido" };
  if (!ESTADOS_VALIDOS.includes(estado as EstadoPedido))
    return { ok: false, error: "Estado no válido" };

  const provider = getProvider();
  const pedido = await provider.getPedido(id);
  if (!pedido) return { ok: false, error: "Pedido no encontrado" };

  const notaLimpia = typeof nota === "string" ? nota.trim().slice(0, 300) || undefined : undefined;
  const actualizado = await provider.actualizarEstadoPedido(
    id,
    estado as EstadoPedido,
    notaLimpia,
    auth.admin.email
  );
  if (!actualizado) return { ok: false, error: "No se pudo actualizar el pedido" };

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath(`/confirmacion/${pedido.numero}`);
  revalidatePath("/cuenta/pedidos");
  return {
    ok: true,
    datos: { mensaje: `Pedido ${pedido.numero} → ${estado.replace(/_/g, " ")}` },
  };
}

/** Confirma un pago manual (Yape/Plin/transferencia) tras verificar el comprobante. */
export async function confirmarPagoPedido(
  id: string,
  metodo: string
): Promise<ResultadoAccion> {
  const auth = await exigirAdminAccion();
  if ("resultado" in auth) return auth.resultado;
  if (!id) return { ok: false, error: "Pedido inválido" };
  if (!PAGOS_VALIDOS.includes(metodo as MetodoPago))
    return { ok: false, error: "Método de pago no válido" };

  const provider = getProvider();
  const pedido = await provider.getPedido(id);
  if (!pedido) return { ok: false, error: "Pedido no encontrado" };
  if (pedido.estado === "entregado" || pedido.estado === "cancelado")
    return { ok: false, error: "El pedido ya está cerrado" };

  await provider.confirmarPagoManual(id, metodo as MetodoPago, auth.admin.email);

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath(`/confirmacion/${pedido.numero}`);
  return { ok: true, datos: { mensaje: `Pago confirmado en ${pedido.numero}` } };
}
