import type { Metadata } from "next";
import { getUsuarioActual } from "@/lib/auth";
import { getProvider } from "@/lib/data";
import { DireccionesCliente } from "@/components/cuenta/direcciones-cliente";

export const metadata: Metadata = {
  title: "Mis direcciones — ITADAKIMASU",
  description: "Gestiona las direcciones de entrega de tus pedidos.",
};

export default async function PaginaDirecciones() {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;
  const direcciones = await getProvider().getDirecciones(usuario.id);

  return <DireccionesCliente direcciones={direcciones} />;
}
