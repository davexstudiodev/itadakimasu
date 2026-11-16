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
  if (perfil.email.endsWith(".invalid"))
    return { ok: false, error: "Una cuenta eliminada no se puede reactivar" };

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
  if (perfil.email.endsWith(".invalid"))
    return { ok: false, error: "No se puede cambiar el rol de una cuenta eliminada" };

  await provider.actualizarPerfil(id, { rol: rol as "admin" | "customer" });
  await provider.registrarAuditoria({
    actor: auth.admin.email,
    accion: "usuario",
    detalle: `Rol de ${perfil.email}: ${perfil.rol} → ${rol}`,
  });

  revalidatePath("/admin/usuarios");
  return { ok: true, datos: { mensaje: `Rol de ${perfil.email} actualizado` } };
}

/** Inhabilita y anonimiza cuentas de clientes; conserva pedidos cerrados. */
export async function eliminarClientes(idsEntrada: unknown): Promise<ResultadoAccion> {
  const auth = await exigirAdminAccion();
  if ("resultado" in auth) return auth.resultado;
  if (!Array.isArray(idsEntrada) || idsEntrada.length === 0 || idsEntrada.length > 200)
    return { ok: false, error: "Selecciona entre 1 y 200 clientes" };
  if (idsEntrada.some((id) => typeof id !== "string" || !id.trim()))
    return { ok: false, error: "Selección de clientes no válida" };

  const ids = [...new Set((idsEntrada as string[]).map((id) => id.trim()))];
  if (ids.includes(auth.admin.id))
    return { ok: false, error: "No puedes eliminar tu propia cuenta" };

  const provider = getProvider();
  const perfiles = await Promise.all(ids.map((id) => provider.getPerfil(id)));
  if (perfiles.some((p) => !p)) return { ok: false, error: "Uno o más clientes ya no existen" };
  if (perfiles.some((p) => p?.rol !== "customer"))
    return { ok: false, error: "Solo puedes eliminar cuentas de clientes; no se eliminó nada" };

  const resultado = await provider.anonimizarClientes(ids);
  if (resultado === "pedido_activo")
    return { ok: false, error: "No se puede eliminar un cliente con pedidos en curso. Cierra primero sus pedidos." };
  if (resultado === "no_encontrado")
    return { ok: false, error: "Uno o más clientes ya no existen. Actualiza la lista e inténtalo de nuevo." };
  if (resultado === "no_cliente")
    return { ok: false, error: "Solo puedes eliminar cuentas de clientes; no se eliminó nada" };

  await provider.registrarAuditoria({
    actor: auth.admin.email,
    accion: "usuario",
    detalle: `Eliminó y anonimizó ${ids.length} cuenta${ids.length === 1 ? "" : "s"} de cliente`,
  });
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/pedidos");
  revalidatePath("/cuenta/pedidos");
  return {
    ok: true,
    datos: {
      mensaje: `${ids.length} cuenta${ids.length === 1 ? " de cliente inhabilitada y anonimizada" : "s de cliente inhabilitadas y anonimizadas"}`,
    },
  };
}
