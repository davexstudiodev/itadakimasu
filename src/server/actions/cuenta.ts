"use server";

import { revalidatePath } from "next/cache";
import { getProvider } from "@/lib/data";
import { getUsuarioActual } from "@/lib/auth";
import { esquemaDireccion } from "@/server/validations";
import type { ResultadoAccion } from "@/types";

async function exigirSesion() {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;
  return usuario;
}

export async function guardarDireccion(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const usuario = await exigirSesion();
  if (!usuario) return { ok: false, error: "Tu sesión expiró" };

  const id = String(formData.get("id") ?? "");
  const parseado = esquemaDireccion.safeParse({
    nombreCompleto: String(formData.get("nombreCompleto") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
    departamento: String(formData.get("departamento") ?? ""),
    provincia: String(formData.get("provincia") ?? ""),
    distrito: String(formData.get("distrito") ?? ""),
    direccion: String(formData.get("direccion") ?? ""),
    referencia: String(formData.get("referencia") ?? ""),
    indicaciones: String(formData.get("indicaciones") ?? ""),
    porDefecto: formData.get("porDefecto") === "on",
  });
  if (!parseado.success) {
    const problema = parseado.error.issues[0];
    return {
      ok: false,
      campo: String(problema.path[0] ?? ""),
      error: problema.message,
    };
  }

  const provider = getProvider();
  const datos = {
    ...parseado.data,
    referencia: parseado.data.referencia || null,
    indicaciones: parseado.data.indicaciones || null,
  };

  if (id) {
    const existente = (await provider.getDirecciones(usuario.id)).find((d) => d.id === id);
    if (!existente) return { ok: false, error: "Dirección no encontrada" };
    await provider.actualizarDireccion(id, datos);
  } else {
    const todas = await provider.getDirecciones(usuario.id);
    await provider.crearDireccion({
      ...datos,
      usuarioId: usuario.id,
      porDefecto: datos.porDefecto ?? todas.length === 0,
    });
  }

  revalidatePath("/cuenta/direcciones");
  return { ok: true, datos: { mensaje: "Dirección guardada" } };
}

export async function eliminarDireccion(id: string): Promise<ResultadoAccion> {
  const usuario = await exigirSesion();
  if (!usuario) return { ok: false, error: "Tu sesión expiró" };
  const provider = getProvider();
  const existente = (await provider.getDirecciones(usuario.id)).find((d) => d.id === id);
  if (!existente) return { ok: false, error: "Dirección no encontrada" };
  await provider.eliminarDireccion(id);
  revalidatePath("/cuenta/direcciones");
  return { ok: true, datos: { mensaje: "Dirección eliminada" } };
}
