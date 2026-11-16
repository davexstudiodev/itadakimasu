"use server";

import { revalidatePath } from "next/cache";
import { getProvider } from "@/lib/data";
import type { ResultadoAccion } from "@/types";
import { exigirAdminAccion } from "./comun";

/* ============================================================
   Gestión de usuarios (solo admin).
   Protecciones: no puedes desactivarte ni degradarte a ti mismo.
   ============================================================ */

export async function alternarUsuario(
  id: string,
  activo: boolean
): Promise<ResultadoAccion> {
  const auth = await exigirAdminAccion();
  if ("resultado" in auth) return auth.resultado;
  if (!id) return { ok: false, error: "Usuario inválido" };
  if (id === auth.admin.id)
    return { ok: false, error: "No puedes desactivar tu propia cuenta" };

  const provider = getProvider();
  const perfil = await provider.getPerfil(id);
  if (!perfil) return { ok: false, error: "Usuario no encontrado" };

  await provider.actualizarPerfil(id, { activo });
  await provider.registrarAuditoria({
    actor: auth.admin.email,
    accion: "usuario",
    detalle: `${activo ? "Activó" : "Desactivó"} a ${perfil.email}`,
  });

  revalidatePath("/admin/usuarios");
  return {
    ok: true,
    datos: { mensaje: `${perfil.email} ${activo ? "activado" : "desactivado"}` },
  };
}

export async function cambiarRolUsuario(id: string, rol: string): Promise<ResultadoAccion> {
  const auth = await exigirAdminAccion();
  if ("resultado" in auth) return auth.resultado;
  if (!id) return { ok: false, error: "Usuario inválido" };
  if (rol !== "admin" && rol !== "customer")
    return { ok: false, error: "Rol no válido" };
  if (id === auth.admin.id)
    return { ok: false, error: "No puedes cambiar tu propio rol" };

  const provider = getProvider();
  const perfil = await provider.getPerfil(id);
  if (!perfil) return { ok: false, error: "Usuario no encontrado" };

  await provider.actualizarPerfil(id, { rol: rol as "admin" | "customer" });
  await provider.registrarAuditoria({
    actor: auth.admin.email,
    accion: "usuario",
    detalle: `Rol de ${perfil.email}: ${perfil.rol} → ${rol}`,
  });

  revalidatePath("/admin/usuarios");
  return { ok: true, datos: { mensaje: `Rol de ${perfil.email} actualizado` } };
}
