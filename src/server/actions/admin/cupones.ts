"use server";

import { revalidatePath } from "next/cache";
import { getProvider } from "@/lib/data";
import { esquemaCupon } from "@/server/validations";
import type { ResultadoAccion } from "@/types";
import { exigirAdminAccion, errorDeZod, numero, numeroOpcional, casilla } from "./comun";

/* ============================================================
   CRUD de cupones de descuento (solo admin).
   ============================================================ */

export async function guardarCupon(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const auth = await exigirAdminAccion();
  if ("resultado" in auth) return auth.resultado;

  const id = String(formData.get("id") ?? "");

  const parseado = esquemaCupon.safeParse({
    codigo: String(formData.get("codigo") ?? ""),
    tipo: String(formData.get("tipo") ?? ""),
    valor: numero(formData, "valor", -1),
    activo: casilla(formData, "activo"),
    fechaInicio: String(formData.get("fechaInicio") ?? ""),
    fechaFin: String(formData.get("fechaFin") ?? ""),
    usosMaximos: numeroOpcional(formData, "usosMaximos"),
    compraMinima: numeroOpcional(formData, "compraMinima"),
    descripcion: String(formData.get("descripcion") ?? ""),
  });
  if (!parseado.success) return errorDeZod(parseado.error.issues);

  const d = parseado.data;
  const provider = getProvider();

  const existentes = await provider.getCupones();
  if (existentes.some((c) => c.codigo === d.codigo && c.id !== id))
    return { ok: false, campo: "codigo", error: "Ya existe un cupón con ese código" };

  const datos = {
    codigo: d.codigo,
    tipo: d.tipo,
    valor: d.valor,
    activo: d.activo,
    fechaInicio: d.fechaInicio || null,
    fechaFin: d.fechaFin || null,
    usosMaximos: d.usosMaximos ?? null,
    compraMinima: d.compraMinima ?? null,
    descripcion: d.descripcion || null,
  };

  if (id) {
    const existente = existentes.find((c) => c.id === id);
    if (!existente) return { ok: false, error: "Cupón no encontrado" };
    await provider.actualizarCupon(id, datos);
  } else {
    await provider.crearCupon(datos);
  }

  await provider.registrarAuditoria({
    actor: auth.admin.email,
    accion: "cupon",
    detalle: `${id ? "Actualizó" : "Creó"} el cupón ${d.codigo}`,
  });

  revalidatePath("/admin/cupones");
  return { ok: true, datos: { mensaje: `Cupón ${d.codigo} guardado` } };
}

export async function eliminarCupon(id: string): Promise<ResultadoAccion> {
  const auth = await exigirAdminAccion();
  if ("resultado" in auth) return auth.resultado;
  if (!id) return { ok: false, error: "Cupón inválido" };

  const provider = getProvider();
  const cupones = await provider.getCupones();
  const existente = cupones.find((c) => c.id === id);
  if (!existente) return { ok: false, error: "Cupón no encontrado" };

  await provider.eliminarCupon(id);
  await provider.registrarAuditoria({
    actor: auth.admin.email,
    accion: "cupon",
    detalle: `Eliminó el cupón ${existente.codigo}`,
  });

  revalidatePath("/admin/cupones");
  return { ok: true, datos: { mensaje: `Cupón ${existente.codigo} eliminado` } };
}
