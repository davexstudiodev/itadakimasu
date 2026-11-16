import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/* ============================================================
   Cliente de Supabase para el servidor (Server Actions,
   Route Handlers y Server Components) con sesiones en cookies.
   Requiere NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.
   ============================================================ */

export function supabaseConfigurado(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

function credenciales(): { url: string; clave: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !clave) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Configura Supabase en .env.local (desarrollo) o en las variables de entorno de Vercel."
    );
  }
  return { url, clave };
}

/** Cliente con cookies reales de la petición (para actions y route handlers). */
export async function crearClienteSupabase(): Promise<SupabaseClient> {
  const { url, clave } = credenciales();
  const almacen = await cookies();

  return createServerClient(url, clave, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => almacen.set(name, value, options));
        } catch {
          // Los Server Components no pueden escribir cookies: en ese caso
          // el refresco lo hace proxy.ts antes de renderizar.
        }
      },
    },
  });
}

/**
 * Cliente con cookies en memoria (NO escribe en la petición).
 * Sirve para verificar una contraseña actual con signInWithPassword
 * sin tocar la sesión real del usuario.
 */
export async function crearClienteSoloLectura(): Promise<SupabaseClient> {
  const { url, clave } = credenciales();
  const mapa = new Map<string, string>();

  return createServerClient(url, clave, {
    cookies: {
      getAll: () => [...mapa].map(([name, value]) => ({ name, value })),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => {
          if (value) mapa.set(name, value);
          else mapa.delete(name);
        });
      },
    },
  });
}
