import type { Metadata } from "next";
import { CarritoCliente } from "@/components/tienda/carrito-cliente";

export const metadata: Metadata = {
  title: "Mi carrito — ITADAKIMASU",
  description: "Revisa los artículos de tu carrito antes de finalizar tu compra.",
};

export default function PaginaCarrito() {
  return (
    <div className="contenedor py-8 sm:py-12">
      <div className="mb-6">
        <p className="texto-jp text-sm text-tomate">買い物カート</p>
        <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-marron">
          Tu carrito
        </h1>
      </div>
      <CarritoCliente />
    </div>
  );
}
