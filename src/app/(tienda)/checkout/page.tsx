import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProvider } from "@/lib/data";
import { exigirUsuario } from "@/lib/auth";
import { CheckoutCliente } from "@/components/tienda/checkout-cliente";

export const metadata: Metadata = {
  title: "Checkout — ITADAKIMASU",
  description: "Completa tu pedido: envío, pago y confirmación.",
};

export default async function PaginaCheckout() {
  const usuario = await exigirUsuario("/checkout");
  const provider = getProvider();
  const [direcciones, cfg] = await Promise.all([
    provider.getDirecciones(usuario.id),
    provider.getConfiguracion(),
  ]);

  // Yape es el único medio de pago habilitado (ver configuración de la tienda).
  if (!cfg.metodosPago.yape) redirect("/carrito");

  return (
    <div className="contenedor py-8 sm:py-12">
      <div className="mb-6">
        <p className="texto-jp text-sm text-tomate">ご注文手続き</p>
        <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-marron">
          Finalizar compra
        </h1>
      </div>

      <CheckoutCliente
        direcciones={direcciones}
        cfg={cfg}
        usuario={{ nombre: usuario.nombre, email: usuario.email, telefono: usuario.telefono ?? "" }}
      />
    </div>
  );
}
