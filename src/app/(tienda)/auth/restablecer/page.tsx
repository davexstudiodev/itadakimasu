import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, ArrowLeft } from "lucide-react";
import { CardAuth } from "@/components/auth/card-auth";
import { FormRestablecer } from "@/components/auth/form-restablecer";
import { authSupabaseActivo } from "@/lib/auth/modo";
import { crearClienteSupabase } from "@/lib/auth/supabase";

export const metadata: Metadata = {
  title: "Restablecer contraseña — ITADAKIMASU",
  description: "Crea una nueva contraseña para tu cuenta.",
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function PaginaRestablecer({ searchParams }: Props) {
  const { token } = await searchParams;

  // Modo local: el enlace trae un token. Modo Supabase: la sesión de
  // recuperación llega en la cookie (tras el paso por /auth/callback).
  let enlaceValido = !!token;
  if (authSupabaseActivo()) {
    const supabase = await crearClienteSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    enlaceValido = !!user;
  }

  if (!enlaceValido) {
    return (
      <CardAuth titulo="Enlace inválido" subtitulo="Este enlace de recuperación no es válido o expiró.">
        <div className="text-center">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-tomate/10">
            <CircleAlert className="h-7 w-7 text-tomate" aria-hidden />
          </span>
          <p className="mt-4 text-sm leading-relaxed text-marron/70">
            Solicita un nuevo enlace de recuperación y úsalo en menos de 30 minutos.
          </p>
          <Link href="/auth/recuperar" className="btn-primary mt-5 inline-flex px-5 py-2.5">
            Solicitar nuevo enlace
          </Link>
          <p className="mt-4 text-sm text-marron/65">
            <Link href="/auth/login" className="inline-flex items-center gap-1 font-semibold text-tomate hover:text-tomate-dark">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </CardAuth>
    );
  }

  return (
    <CardAuth
      titulo="Nueva contraseña"
      subtitulo="Elige una contraseña diferente a la anterior."
      textoJp="パスワード再設定"
    >
      <FormRestablecer token={token ?? ""} />
    </CardAuth>
  );
}
