import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/* ============================================================
   Proxy de Next.js 16 (antes middleware).
   Refresca la sesión de Supabase Auth antes de renderizar,
   para que las Server Components siempre reciban cookies
   vigentes. Solo actúa cuando AUTH_MODE=supabase.
   ============================================================ */

export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseActivo =
    (process.env.AUTH_MODE ?? "local").toLowerCase() === "supabase" && !!url && !!clave;

  if (supabaseActivo && url && clave) {
    const supabase = createServerClient(url, clave, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          respuesta = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options)
          );
        },
      },
    });

    // getUser() valida el token y refresca los que estén por vencer.
    await supabase.auth.getUser();
  }

  return respuesta;
}

export const config = {
  // Excluye estáticos (imágenes, fuentes, favicon) del refresco.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|productos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
