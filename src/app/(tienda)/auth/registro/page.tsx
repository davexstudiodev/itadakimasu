import type { Metadata } from "next";
import { CardAuth } from "@/components/auth/card-auth";
import { FormRegistro } from "@/components/auth/form-registro";

export const metadata: Metadata = {
  title: "Crear cuenta — ITADAKIMASU",
  description: "Crea tu cuenta gratis y empieza a comprar ramen, snacks y bebidas japonesas y coreanas.",
};

export default function PaginaRegistro() {
  return (
    <CardAuth
      titulo="Crea tu cuenta"
      subtitulo="Un minuto y ya puedes comprar y seguir tus pedidos."
      textoJp="登録"
    >
      <FormRegistro />
    </CardAuth>
  );
}
