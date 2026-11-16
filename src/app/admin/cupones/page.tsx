import type { Metadata } from "next";
import { getProvider } from "@/lib/data";
import { GestionCupones } from "@/components/admin/gestion-cupones";

export const metadata: Metadata = { title: "Cupones" };

export default async function PaginaCupones() {
  const cupones = await getProvider().getCupones();

  return (
    <div className="space-y-5">
      <div>
        <p className="texto-jp text-sm text-tomate">クーポン</p>
        <h1 className="mt-1 font-display text-2xl font-black tracking-tight text-marron sm:text-3xl">
          Cupones
        </h1>
        <p className="mt-1 text-sm text-marron/60">
          Códigos de descuento que los clientes aplican en el checkout.
        </p>
      </div>

      <GestionCupones cupones={cupones} />
    </div>
  );
}
