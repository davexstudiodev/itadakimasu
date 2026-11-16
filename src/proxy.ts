import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

/* ============================================================
   Proxy de Next.js 16 (antes middleware).
   Refresca la sesión de Supabase Auth antes de renderizar,
   para que las Server Components siempre reciban cookies
   vigentes. Solo actúa cuando AUTH_MODE=supabase.
   ============================================================ */

export async function proxy(request: NextRequest) {
  // Nunca aceptar estos valores enviados por el navegador. Solo se vuelven a
  // añadir después de validar la sesión con Supabase Auth.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-ita-user-id");
  requestHeaders.delete("x-ita-user-email");
  const cookiesPendientes: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }> = [];

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
          cookiesPendientes.push(...lista);
        },
      },
    });

    // getUser() valida el token y refresca los que estén por vencer.
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      requestHeaders.set("x-ita-user-id", user.id);
      requestHeaders.set("x-ita-user-email", user.email);
    }
  }

  let respuesta = NextResponse.next({ request: { headers: requestHeaders } });
  cookiesPendientes.forEach(({ name, value, options }) =>
    respuesta.cookies.set(name, value, options)
  );
  return respuesta;
}

export const config = {
  // Excluye estáticos (imágenes, fuentes, favicon) del refresco.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|productos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
