"use server";

import { revalidatePath } from "next/cache";
import { getProvider } from "@/lib/data";
import type { ResultadoAccion } from "@/types";
import { exigirAdminAccion, numero } from "./comun";

/* ============================================================
   Inventario (solo admin): entradas, salidas y ajustes de stock.
   Cada movimiento queda registrado con autor y motivo.
   ============================================================ */

export async function ajustarInventario(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const auth = await exigirAdminAccion();
  if ("resultado" in auth) return auth.resultado;

  const productoId = String(formData.get("productoId") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const cantidad = numero(formData, "cantidad", 0);
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!productoId) return { ok: false, campo: "productoId", error: "Selecciona un producto" };
  if (!["entrada", "salida", "ajuste"].includes(tipo))
    return { ok: false, campo: "tipo", error: "Tipo de movimiento no válido" };
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99999)
    return { ok: false, campo: "cantidad", error: "La cantidad debe ser entre 1 y 99999" };
  if (motivo.length < 3)
    return { ok: false, campo: "motivo", error: "Indica un motivo (mínimo 3 caracteres)" };

  const provider = getProvider();
  const producto = await provider.getProductoPorId(productoId);
  if (!producto) return { ok: false, error: "Producto no encontrado" };

  // "ajuste" fija el stock absoluto; entrada/saldida son deltas
  const delta =
    tipo === "ajuste"
      ? cantidad - producto.stock
      : tipo === "entrada"
        ? cantidad
        : -Math.min(cantidad, producto.stock);

  const r = await provider.ajustarStock(productoId, delta, motivo, auth.admin.email);
  if (!r.ok) return { ok: false, error: r.error ?? "No se pudo ajustar el stock" };

  revalidatePath("/admin/inventario");
  revalidatePath("/admin/productos");
  return {
    ok: true,
    datos: { mensaje: `${producto.nombre}: stock ahora en ${r.stock}` },
  };
}
