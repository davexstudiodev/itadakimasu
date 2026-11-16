import type { Metadata } from "next";
import { CardAuth } from "@/components/auth/card-auth";
import { FormLogin } from "@/components/auth/form-login";

export const metadata: Metadata = {
  title: "Iniciar sesión — ITADAKIMASU",
  description: "Accede a tu cuenta para comprar, seguir tus pedidos y guardar tus favoritos.",
};

interface Props {
  searchParams: Promise<{ next?: string; email?: string }>;
}

export default async function PaginaLogin({ searchParams }: Props) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const email = typeof sp.email === "string" ? sp.email : undefined;

  return (
    <CardAuth
      titulo="Bienvenido de vuelta"
      subtitulo="Inicia sesión para continuar con tu pedido."
      textoJp="おかえりなさい"
    >
      <FormLogin next={next} emailSugerido={email} />
    </CardAuth>
  );
}
