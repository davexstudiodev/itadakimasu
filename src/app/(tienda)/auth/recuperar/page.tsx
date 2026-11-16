import type { Metadata } from "next";
import { CardAuth } from "@/components/auth/card-auth";
import { FormRecuperar } from "@/components/auth/form-recuperar";

export const metadata: Metadata = {
  title: "Recuperar contraseña — ITADAKIMASU",
  description: "Solicita un enlace para restablecer la contraseña de tu cuenta.",
};

export default function PaginaRecuperar() {
  return (
    <CardAuth
      titulo="Recupera tu contraseña"
      subtitulo="Te enviaremos un enlace seguro."
      textoJp="パスワード再設定"
    >
      <FormRecuperar />
    </CardAuth>
  );
}
