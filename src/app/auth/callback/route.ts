import { NextResponse, type NextRequest } from "next/server";
import { crearClienteSupabase } from "@/lib/auth/supabase";

/* ============================================================
   Callback de autenticación (flujo PKCE de Supabase).
   Las llegan con ?code=... desde Supabase (confirmación de
   correo, recuperación de contraseña, OAuth). Intercambia el
   código por una sesión en cookies y redirige a `next`.
   ============================================================ */

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const codigo = searchParams.get("code");
  const crudo = searchParams.get("next") ?? "/";
  const destino = crudo.startsWith("/") && !crudo.startsWith("//") ? crudo : "/";

  if (codigo) {
    try {
      const supabase = await crearClienteSupabase();
      const { error } = await supabase.auth.exchangeCodeForSession(codigo);
      if (!error) return NextResponse.redirect(`${origin}${destino}`);
    } catch {
      // Sin credenciales o red caída: se muestra el estado de enlace inválido.
    }
  }

  // Enlace inválido/expirado: si iban a restablecer, esa página muestra
  // el aviso; en cualquier otro caso, volvemos a solicitar el enlace.
  const fallo = destino === "/auth/restablecer" ? destino : "/auth/recuperar";
  return NextResponse.redirect(`${origin}${fallo}`);
}
