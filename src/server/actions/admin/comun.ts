import { getUsuarioActual } from "@/lib/auth";
import { limitar } from "@/lib/rate-limit";
import type { Perfil, ResultadoAccion } from "@/types";

/* ============================================================
   Helpers compartidos por todas las acciones de administración.
   Toda acción admin verifica el rol EN EL SERVIDOR (nunca se
   confía en nada venga del navegador) y aplica rate limiting.
   ============================================================ */

export type ResultadoAdmin = ResultadoAccion;

/** Exige sesión + rol admin + límite de peticiones. */
export async function exigirAdminAccion(): Promise<
  { admin: Perfil } | { resultado: ResultadoAdmin }
> {
  const admin = await getUsuarioActual();
  if (!admin) return { resultado: { ok: false, error: "Tu sesión expiró. Inicia sesión de nuevo." } };
  if (admin.rol !== "admin")
    return { resultado: { ok: false, error: "No tienes permisos de administrador" } };
  if (!limitar(`admin:${admin.id}`, 90))
    return { resultado: { ok: false, error: "Demasiadas operaciones seguidas. Espera un minuto." } };
  return { admin };
}

/** Convierte el primer error de Zod en un ResultadoAccion. */
export function errorDeZod(issues: { path: PropertyKey[]; message: string }[]): ResultadoAdmin {
  const problema = issues[0];
  return {
    ok: false,
    campo: String(problema.path[0] ?? ""),
    error: problema.message,
  };
}

/** Lee un campo numérico del FormData (vacío → null). */
export function numeroOpcional(fd: FormData, campo: string): number | null {
  const bruto = String(fd.get(campo) ?? "").trim();
  if (bruto === "") return null;
  const n = Number(bruto);
  return Number.isFinite(n) ? n : null;
}

/** Lee un campo numérico del FormData (vacío → valor por defecto). */
export function numero(fd: FormData, campo: string, defecto = 0): number {
  return numeroOpcional(fd, campo) ?? defecto;
}

/** Lee un checkbox de FormData como boolean. */
export function casilla(fd: FormData, campo: string): boolean {
  return fd.get(campo) === "on" || fd.get(campo) === "true";
}
