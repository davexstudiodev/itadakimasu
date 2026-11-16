import "server-only";
import { redirect } from "next/navigation";
import { getProvider } from "@/lib/data";
import type { Perfil } from "@/types";
import { authSupabaseActivo } from "./modo";
import { obtenerUsuarioId } from "./session";
import { crearClienteSupabase } from "./supabase";

/* ============================================================
   Autenticación y autorización (siempre verificadas en servidor).
   El rol NUNCA se acepta desde el cliente: se lee de la BD.
   ============================================================ */

/** Devuelve el perfil del usuario autenticado o null. */
export async function getUsuarioActual(): Promise<Perfil | null> {
  if (authSupabaseActivo()) {
    const supabase = await crearClienteSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;

    const provider = getProvider();
    let perfil = await provider.getPerfil(user.id);

    if (!perfil) {
      // Primera vez que entra esta cuenta en la BD: si el correo ya
      // existe con otro id (migración), se reutiliza ese perfil.
      const existente = await provider.getPerfilPorEmail(user.email);
      if (existente) {
        perfil = existente;
      } else {
        const meta = (user.user_metadata ?? {}) as Record<string, string>;
        try {
          perfil = await provider.crearPerfil({
            id: user.id,
            email: user.email,
            nombre: meta.nombre || user.email.split("@")[0],
            apellidos: meta.apellidos || "",
            telefono: meta.telefono || undefined,
          });
        } catch {
          return null; // correo tomado por otra cuenta: nada que hacer
        }
      }
    }

    if (!perfil.activo) return null;
    return perfil;
  }

  const id = await obtenerUsuarioId();
  if (!id) return null;
  const perfil = await getProvider().getPerfil(id);
  if (!perfil || !perfil.activo) return null;
  return perfil;
}

export async function getRol(): Promise<"guest" | "customer" | "admin"> {
  const usuario = await getUsuarioActual();
  return usuario ? usuario.rol : "guest";
}

/** Exige usuario autenticado; redirige al login si no lo está. */
export async function exigirUsuario(next?: string): Promise<Perfil> {
  const usuario = await getUsuarioActual();
  if (!usuario) {
    const destino = next ? `?next=${encodeURIComponent(next)}` : "";
    redirect(`/auth/login${destino}`);
  }
  return usuario;
}

/** Exige rol admin; redirige a la página 403 si no lo tiene. */
export async function exigirAdmin(): Promise<Perfil> {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/auth/login?next=/admin");
  if (usuario.rol !== "admin") redirect("/acceso-denegado");
  return usuario;
}
